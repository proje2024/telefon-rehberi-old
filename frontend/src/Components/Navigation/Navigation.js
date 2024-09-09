import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BackupIcon from '@mui/icons-material/Backup';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../../Authenticator';
import { useSubscription } from '../../Context/SubscriptionContext';
import Axios from '../../Axios';

const Navigation = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const {subscriptions,loading,addSubscription,editSubscription,deleteSubscription } = useSubscription();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [updatedLabel, setUpdatedLabel] = useState('');
  const [newSubscriptionLabel, setNewSubscriptionLabel] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  const userRole = JSON.parse(localStorage.getItem('user'))?.role;
  const isRoleAdmin = userRole === 1;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await Axios.post('/api/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")
        setIsLoggedIn(false);
        navigate('/login');
      } else {
        alert('Çıkış başarısız. Tekrar deneyin!');
      }
    } catch (error) {
      alert('Çıkış başarısız. Internet bağlantınızı kontrol edin!');
    }
  };

  const handleSubscriptionDialogOpen = () => {
    setSubscriptionDialogOpen(true);
  };

  const handleSubscriptionDialogClose = () => {
    setSubscriptionDialogOpen(false);
  };

  const handleEditDialogOpen = (subscription) => {
    setSelectedSubscription(subscription);
    setUpdatedLabel(subscription.label);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedSubscription(null);
  };

  const handleEditSubscription = () => {
    if (selectedSubscription) {
      editSubscription(selectedSubscription.value, updatedLabel);
      handleEditDialogClose();
    }
  };

  const handleAddDialogOpen = () => {
    setNewSubscriptionLabel('');
    setAddDialogOpen(true);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  const handleAddSubscription = () => {
    addSubscription(newSubscriptionLabel);
    handleAddDialogClose();
  };

  const handleDeleteSubscription = (id) => {
    deleteSubscription(id);
  };

  const handleBackup = async () => {
    try {
      const response = await Axios.post('/api/directory/backupDatabase', {}, { responseType: 'blob' });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const now = new Date();
        const formattedDate = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
        const filename = `database_backup_${formattedDate}.db`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Yedekleme işlemi sırasında bir hata oluştu.');
    }
  };

  const handleRestoreDialogOpen = () => {
    setRestoreDialogOpen(true);
  };

  const handleRestoreDialogClose = () => {
    setRestoreDialogOpen(false);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleRestore = async () => {
    if (!file) {
      alert('Lütfen bir dosya seçin.');
      return;
    }

    setLoadingRestore(true);
    setRestoreMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await Axios.post('/api/directory/restoreDatabase', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        setRestoreMessage('Veritabanı başarıyla geri yüklendi.');
      } else {
        setRestoreMessage('Geri yükleme sırasında bir hata oluştu.');
      }
    } catch (error) {
      setRestoreMessage('Geri yükleme sırasında bir hata oluştu.');
    } finally {
      setLoadingRestore(false);
      handleRestoreDialogClose();
    }
  };

  const renderTooltipIconButton = (title, onClick, IconComponent, style = {}) => (
    <Tooltip
      title={title}
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            fontSize: '14px',
            color: 'white',
          },
        },
      }}
    >
      <IconButton onClick={onClick} style={{ color: 'white', ...style }}>
        {IconComponent}
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      {isLoggedIn && (
        <>
          {isRoleAdmin && renderTooltipIconButton("Veritabanını Yedekle", handleBackup, <CloudDownloadIcon />)}
          {isRoleAdmin && renderTooltipIconButton("Veritabanını Geri Yükle", handleRestoreDialogOpen, <BackupIcon />)}
          {isRoleAdmin && renderTooltipIconButton("Abonelik Yönetimi", handleSubscriptionDialogOpen, <ManageAccountsIcon />)}
          {renderTooltipIconButton("Çıkış Yap", handleLogout, <ExitToAppIcon />)}
          <Dialog
            open={subscriptionDialogOpen}
            onClose={handleSubscriptionDialogClose}
            PaperProps={{
              style: {
                borderRadius: '15px',
              },
            }}
          >
            <DialogTitle>
              Abonelik Yönetimi
              <IconButton
                edge="end"
                color="primary"
                aria-label="add"
                onClick={handleAddDialogOpen}
                style={{ marginLeft: '10px' }}
              >
                <AddIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {loading ? (
                <CircularProgress />
              ) : (
                <List>
                  {subscriptions.map((subscription) => (
                    <React.Fragment key={subscription.value}>
                      <ListItem>
                        <ListItemText primary={subscription.label} />
                        <ListItemSecondaryAction>
                          <Tooltip title="Düzenle">
                            <IconButton
                              edge="end"
                              aria-label="edit"
                              onClick={() => handleEditDialogOpen(subscription)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteSubscription(subscription.value)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
          </Dialog>

          <Dialog
            open={editDialogOpen}
            onClose={handleEditDialogClose}
            PaperProps={{
              style: { borderRadius: '15px' },
            }}
          >
            <DialogTitle>Abonelik Türünü Düzenle</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Abonelik Türü"
                type="text"
                fullWidth
                value={updatedLabel}
                onChange={(e) => setUpdatedLabel(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditDialogClose} color="primary">
                İptal
              </Button>
              <Button onClick={handleEditSubscription} color="primary">
                Güncelle
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Add Subscription Dialog */}
          <Dialog
            open={addDialogOpen}
            onClose={handleAddDialogClose}
            PaperProps={{
              style: { borderRadius: '15px' },
            }}
          >
            <DialogTitle>Yeni Abonelik Ekle</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Abonelik Türü"
                type="text"
                fullWidth
                value={newSubscriptionLabel}
                onChange={(e) => setNewSubscriptionLabel(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAddDialogClose} color="primary">
                İptal
              </Button>
              <Button onClick={handleAddSubscription} color="primary">
                Ekle
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Restore Database Dialog */}
          <Dialog
            open={restoreDialogOpen}
            onClose={handleRestoreDialogClose}
            PaperProps={{
              style: { borderRadius: '15px' },
            }}
          >
            <DialogTitle>Veritabanını Geri Yükle</DialogTitle>
            <DialogContent>
              <input
                type="file"
                accept=".db"
                onChange={handleFileChange}
                style={{ display: 'block', marginBottom: '10px' }}
              />
              {loadingRestore && <CircularProgress />}
              {restoreMessage && <div>{restoreMessage}</div>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleRestoreDialogClose} color="primary">
                İptal
              </Button>
              <Button onClick={handleRestore} color="primary" disabled={loadingRestore}>
                Geri Yükle
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  );
};

export default Navigation;
