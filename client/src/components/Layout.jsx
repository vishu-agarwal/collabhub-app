import { useState, useEffect } from 'react'
import { useNavigate, useParams, Outlet } from 'react-router-dom'
import axios from 'axios'
import {
  Avatar, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import TagIcon from '@mui/icons-material/Tag'

const API_URL = 'http://localhost:5000/api'

export default function Layout() {
  const navigate = useNavigate()
  const { id: activeId } = useParams()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [channels, setChannels] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API_URL}/channels`, {
        headers: { Authorization: token }
      })
      setChannels(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const createChannel = async () => {
    try {
      await axios.post(
        `${API_URL}/channels/create`,
        { name: newName, description: newDesc },
        { headers: { Authorization: token } }
      )
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
      fetchChannels()
    } catch (err) {
      console.log(err)
    }
  }

  const handleChannelClick = async (channelId) => {
    try {
      await axios.post(`${API_URL}/channels/join/${channelId}`, {}, {
        headers: { Authorization: token }
      })
      navigate(`/channels/${channelId}`)
    } catch (err) {
      console.log(err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const initials = (name) => (name ? name.charAt(0).toUpperCase() : '?')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f6f8' }}>
      <header style={{
        height: 54,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 100,
        gap: 16
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/channels')}
        >
          <img src="/webvoltz.svg" alt="Webvoltz" style={{ height: 18 }} />
        </div>

        {activeId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span style={{ color: '#d1d5db', fontSize: 18, fontWeight: 300 }}>/</span>
            <TagIcon sx={{ fontSize: 14, color: '#FFD600' }} />
            <span style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>
              {channels.find(c => c._id === activeId)?.name || '...'}
            </span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar sx={{
              width: 28, height: 28, bgcolor: '#FFD600',
              color: '#111827', fontSize: 12, fontWeight: 800
            }}>
              {initials(user.username)}
            </Avatar>
            <span style={{ color: '#374151', fontSize: 13 }}>{user.username || 'User'}</span>
          </div>
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{ color: '#9ca3af', '&:hover': { color: '#111827', background: '#f3f4f6' } }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        <aside style={{
          width: 232,
          background: '#f3f4f6',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '18px 14px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              color: '#9ca3af',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              Channels
            </span>
            <Tooltip title="Create channel">
              <IconButton
                size="small"
                onClick={() => setCreateOpen(true)}
                sx={{
                  color: '#9ca3af',
                  width: 22, height: 22,
                  '&:hover': { color: '#111827', background: '#e5e7eb' }
                }}
              >
                <AddIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </div>

          <div style={{ flex: 1, padding: '4px 8px 12px' }}>
            {channels.map(channel => {
              const isActive = channel._id === activeId
              return (
                <div
                  key={channel._id}
                  onClick={() => handleChannelClick(channel._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    borderRadius: 7,
                    cursor: 'pointer',
                    marginBottom: 1,
                    background: isActive ? '#FFD600' : 'transparent',
                    transition: 'all 0.12s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#e5e7eb' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <TagIcon sx={{
                    fontSize: 14,
                    color: isActive ? '#111827' : '#9ca3af',
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontSize: 13.5,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#111827' : '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {channel.name}
                  </span>
                </div>
              )
            })}

            {channels.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: 12, padding: '6px 10px', margin: 0 }}>
                No channels yet
              </p>
            )}
          </div>

          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: 9
          }}>
            <Avatar sx={{
              width: 26, height: 26, bgcolor: '#FFD600',
              color: '#111827', fontSize: 11, fontWeight: 800
            }}>
              {initials(user.username)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 600,
                color: '#374151',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {user.username || 'User'}
              </p>
              <p style={{
                margin: 0, fontSize: 10.5, color: '#9ca3af',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {user.email || ''}
              </p>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          </div>
        </aside>

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
          <Outlet />
        </main>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { background: '#ffffff', borderRadius: 2, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }
        }}
      >
        <DialogTitle sx={{ color: '#111827', fontWeight: 700, fontSize: 16, pb: 1 }}>
          Create a Channel
        </DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6 }}>
            <TextField
              placeholder="channel-name"
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD600' }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#111827' }
              }}
            />
            <TextField
              placeholder="What's this channel about?"
              label="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD600' }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#111827' }
              }}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setCreateOpen(false)}
            sx={{ color: '#6b7280', textTransform: 'none', '&:hover': { background: '#f3f4f6' } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createChannel}
            sx={{
              background: '#FFD600', color: '#111827',
              fontWeight: 700, textTransform: 'none',
              borderRadius: 1.5, boxShadow: 'none',
              '&:hover': { background: '#e6c200', boxShadow: 'none' }
            }}
          >
            Create Channel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
