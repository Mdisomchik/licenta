import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Inbox,
  Send,
  Star,
  StarBorder,
  Delete,
  Archive,
  Label,
  Add,
  Settings,
  Report,
} from '@mui/icons-material';
import axios from 'axios';
import EmailList from './components/EmailList';
import ComposeEmail from './components/ComposeEmail';
import LabelManager from './components/LabelManager';

const App = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [labels, setLabels] = useState([]);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [labelAnchorEl, setLabelAnchorEl] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Inbox');

  const googleLogin = useGoogleLogin({
    clientId: '106794135380-9j6ahfrekahtdoom51rlcq44ltd7empk.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setError('Google login failed.');
    },
  });

  useEffect(() => {
    const fetchEmails = async () => {
      if (accessToken) {
        setLoading(true);
        try {
          const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/messages', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              maxResults: 20,
            },
          });

          const emailDetailsPromises = response.data.messages.map(async (message) => {
            const emailDetailsResponse = await axios.get(`https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              params: {
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Date'],
              },
            });
            return {
              id: emailDetailsResponse.data.id,
              from: emailDetailsResponse.data.payload.headers.find(header => header.name === 'From')?.value,
              subject: emailDetailsResponse.data.payload.headers.find(header => header.name === 'Subject')?.value || '(No Subject)',
              date: emailDetailsResponse.data.payload.headers.find(header => header.name === 'Date')?.value,
              labels: emailDetailsResponse.data.labelIds || [],
              starred: emailDetailsResponse.data.labelIds?.includes('STARRED') || false,
            };
          });

          const details = await Promise.all(emailDetailsPromises);
          setEmails(details);
          setError(null);
        } catch (err) {
          console.error('Error fetching emails:', err);
          setError('Failed to fetch emails.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEmails();
  }, [accessToken]);

  useEffect(() => {
    const fetchLabels = async () => {
      if (accessToken) {
        try {
          const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/labels', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setLabels(response.data.labels.filter(label => label.type === 'user'));
        } catch (err) {
          console.error('Error fetching labels:', err);
          setError('Failed to fetch labels.');
        }
      }
    };

    fetchLabels();
  }, [accessToken]);

  const handleSendEmail = async (emailData) => {
    try {
      const message = [
        'Content-Type: text/plain; charset="UTF-8"\n',
        'MIME-Version: 1.0\n',
        `To: ${emailData.to}\n`,
        `Subject: ${emailData.subject}\n\n`,
        emailData.body,
      ].join('');

      const encodedMessage = btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      await axios.post(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: encodedMessage },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Failed to send email.');
    }
  };

  const handleAddLabel = async (labelName) => {
    try {
      const response = await axios.post(
        'https://www.googleapis.com/gmail/v1/users/me/labels',
        {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setLabels([...labels, response.data]);
    } catch (err) {
      console.error('Error creating label:', err);
      setError('Failed to create label.');
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await axios.delete(
        `https://www.googleapis.com/gmail/v1/users/me/labels/${labelId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setLabels(labels.filter(label => label.id !== labelId));
    } catch (err) {
      console.error('Error deleting label:', err);
      setError('Failed to delete label.');
    }
  };

  const handleUpdateLabel = async (oldLabel, newName) => {
    try {
      const response = await axios.patch(
        `https://www.googleapis.com/gmail/v1/users/me/labels/${oldLabel.id}`,
        {
          name: newName,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setLabels(labels.map(label => 
        label.id === oldLabel.id ? response.data : label
      ));
    } catch (err) {
      console.error('Error updating label:', err);
      setError('Failed to update label.');
    }
  };

  const handleStarEmail = async (email) => {
    try {
      const method = email.starred ? 'remove' : 'add';
      await axios.post(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${email.id}/modify`,
        {
          addLabelIds: method === 'add' ? ['STARRED'] : [],
          removeLabelIds: method === 'remove' ? ['STARRED'] : [],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setEmails(emails.map(e => 
        e.id === email.id ? { ...e, starred: !e.starred } : e
      ));
    } catch (err) {
      console.error('Error starring email:', err);
      setError('Failed to star/unstar email.');
    }
  };

  const handleAddLabelToEmail = async (email, labelId) => {
    try {
      await axios.post(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${email.id}/modify`,
        {
          addLabelIds: [labelId],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setEmails(emails.map(e => 
        e.id === email.id ? { ...e, labels: [...e.labels, labelId] } : e
      ));
    } catch (err) {
      console.error('Error adding label to email:', err);
      setError('Failed to add label to email.');
    }
  };

  const handleEmailDelete = async (email) => {
    try {
      await axios.post(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${email.id}/modify`,
        {
          addLabelIds: ['TRASH'],
          removeLabelIds: [],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setEmails(emails.map(e =>
        e.id === email.id
          ? { ...e, labels: [...(e.labels.filter(l => l !== 'INBOX')), 'TRASH'] }
          : e
      ));
    } catch (err) {
      console.error('Error deleting email:', err);
      setError('Failed to delete email.');
    }
  };

  const handleEmailArchive = async (email) => {
    try {
      await axios.post(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${email.id}/modify`,
        {
          removeLabelIds: ['INBOX'],
          addLabelIds: [],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setEmails(emails.map(e =>
        e.id === email.id
          ? { ...e, labels: e.labels.filter(l => l !== 'INBOX') }
          : e
      ));
    } catch (err) {
      console.error('Error archiving email:', err);
      setError('Failed to archive email.');
    }
  };

  const getFilteredEmails = () => {
    switch (selectedTab) {
      case 'Inbox':
        return emails.filter(email => email.labels?.includes('INBOX'));
      case 'Sent':
        return emails.filter(email => email.labels?.includes('SENT'));
      case 'Starred':
        return emails.filter(email => email.starred);
      case 'Archive':
        return emails.filter(email => !email.labels?.includes('INBOX') && !email.labels?.includes('SENT') && !email.labels?.includes('TRASH') && !email.labels?.includes('SPAM'));
      case 'Trash':
        return emails.filter(email => email.labels?.includes('TRASH'));
      case 'Spam':
        return emails.filter(email => email.labels?.includes('SPAM'));
      default:
        return emails;
    }
  };

  const menuItems = [
    { text: 'Inbox', icon: <Inbox /> },
    { text: 'Sent', icon: <Send /> },
    { text: 'Starred', icon: <Star /> },
    { text: 'Archive', icon: <Archive /> },
    { text: 'Trash', icon: <Delete /> },
    { text: 'Spam', icon: <Report /> },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Mail Filter App
          </Typography>
          {!accessToken ? (
            <Button color="inherit" onClick={googleLogin}>
              Login with Google
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setComposeOpen(true)}
              sx={{ mr: 2 }}
            >
              Compose
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            marginTop: '64px',
          },
        }}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              selected={selectedTab === item.text}
              onClick={() => setSelectedTab(item.text)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem button onClick={() => setLabelManagerOpen(true)}>
            <ListItemIcon>
              <Label />
            </ListItemIcon>
            <ListItemText primary="Manage Labels" />
          </ListItem>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Container maxWidth="lg">
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : accessToken ? (
            <EmailList
              emails={getFilteredEmails()}
              onEmailSelect={setSelectedEmail}
              onLabelAdd={handleAddLabelToEmail}
              onEmailDelete={handleEmailDelete}
              onEmailArchive={handleEmailArchive}
              onStarEmail={handleStarEmail}
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography variant="h6" color="textSecondary">
                Please login to view your emails
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      <LabelManager
        open={labelManagerOpen}
        onClose={() => setLabelManagerOpen(false)}
        labels={labels}
        onAddLabel={handleAddLabel}
        onDeleteLabel={handleDeleteLabel}
        onUpdateLabel={handleUpdateLabel}
      />

      <ComposeEmail
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={handleSendEmail}
      />
    </Box>
  );
};

const AppWrapper = () => (
  <GoogleOAuthProvider clientId="106794135380-9j6ahfrekahtdoom51rlcq44ltd7empk.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);

export default AppWrapper;