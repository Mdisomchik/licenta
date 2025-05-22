import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Box,
  Typography,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Star,
  StarBorder,
  Label,
  MoreVert,
  Delete,
  Archive,
} from '@mui/icons-material';
import { format } from 'date-fns';

const EmailList = ({
  emails,
  onEmailSelect,
  onLabelAdd,
  onEmailDelete,
  onEmailArchive,
  onStarEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [labelAnchorEl, setLabelAnchorEl] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const handleMenuClick = (event, email) => {
    setLabelAnchorEl(event.currentTarget);
    setSelectedEmail(email);
  };

  const handleMenuClose = () => {
    setLabelAnchorEl(null);
    setSelectedEmail(null);
  };

  const handleLabelClick = (event, email) => {
    setLabelAnchorEl(event.currentTarget);
    setSelectedEmail(email);
  };

  const handleLabelSelect = (labelId) => {
    if (selectedEmail) {
      onLabelAdd(selectedEmail, labelId);
    }
    handleMenuClose();
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLabel = !filterLabel || email.labels?.includes(filterLabel);
    return matchesSearch && matchesLabel;
  });

  return (
    <Box sx={{ width: '100%', maxWidth: 800, bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {['Important', 'Work', 'Personal'].map((label) => (
            <Chip
              key={label}
              label={label}
              onClick={() => setFilterLabel(filterLabel === label ? '' : label)}
              color={filterLabel === label ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>
      <List>
        {filteredEmails.map((email) => (
          <ListItem
            key={email.id}
            button
            onClick={() => onEmailSelect(email)}
            sx={{
              borderBottom: '1px solid #eee',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <ListItemIcon>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onStarEmail(email);
                }}
              >
                {email.starred ? <Star color="primary" /> : <StarBorder />}
              </IconButton>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" component="span">
                    {email.from}
                  </Typography>
                  {email.labels?.map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  ))}
                </Box>
              }
              secondary={
                <>
                  <Typography variant="subtitle2">{email.subject}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(email.date).toLocaleString()}
                  </Typography>
                </>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLabelClick(e, email);
                }}
              >
                <Label />
              </IconButton>
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  onEmailArchive(email);
                }}
              >
                <Archive />
              </IconButton>
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  onEmailDelete(email);
                }}
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Menu
        anchorEl={labelAnchorEl}
        open={Boolean(labelAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleLabelSelect('IMPORTANT')}>
          Important
        </MenuItem>
        <MenuItem onClick={() => handleLabelSelect('WORK')}>
          Work
        </MenuItem>
        <MenuItem onClick={() => handleLabelSelect('PERSONAL')}>
          Personal
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EmailList; 