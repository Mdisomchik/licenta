import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

const LabelManager = ({ open, onClose, labels, onAddLabel, onDeleteLabel, onUpdateLabel }) => {
  const [newLabel, setNewLabel] = useState('');
  const [editingLabel, setEditingLabel] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      onAddLabel(newLabel.trim());
      setNewLabel('');
    }
  };

  const handleEditLabel = (label) => {
    setEditingLabel(label);
    setEditValue(label);
  };

  const handleUpdateLabel = () => {
    if (editValue.trim()) {
      onUpdateLabel(editingLabel, editValue.trim());
      setEditingLabel(null);
      setEditValue('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Labels</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="New Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
          />
          <Button
            variant="contained"
            onClick={handleAddLabel}
            sx={{ mt: 1 }}
          >
            Add Label
          </Button>
        </Box>
        <List>
          {labels.map((label) => (
            <ListItem key={label}>
              {editingLabel === label ? (
                <TextField
                  fullWidth
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUpdateLabel()}
                />
              ) : (
                <ListItemText primary={label} />
              )}
              <ListItemSecondaryAction>
                {editingLabel === label ? (
                  <Button onClick={handleUpdateLabel}>Save</Button>
                ) : (
                  <>
                    <IconButton edge="end" onClick={() => handleEditLabel(label)}>
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" onClick={() => onDeleteLabel(label)}>
                      <Delete />
                    </IconButton>
                  </>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabelManager; 