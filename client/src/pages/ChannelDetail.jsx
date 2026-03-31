import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'
import {
  TextField, Button, Avatar, Select,
  MenuItem, FormControl, InputLabel, IconButton,
  Tab, Tabs
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AddTaskIcon from '@mui/icons-material/AddTask'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import TagIcon from '@mui/icons-material/Tag'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined'

const API_URL = 'http://localhost:5000/api'
const SOCKET_URL = 'http://localhost:5000'

let socket = io(SOCKET_URL)

const initials = (name) => (name ? name.charAt(0).toUpperCase() : '?')

const avatarColor = (name = '') => {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899']
  return colors[name.charCodeAt(0) % colors.length]
}

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const lightInputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#111827',
    backgroundColor: '#f9fafb',
    fontSize: 13,
    '& fieldset': { borderColor: '#e5e7eb' },
    '&:hover fieldset': { borderColor: '#d1d5db' },
    '&.Mui-focused fieldset': { borderColor: '#FFD600', borderWidth: 1.5 }
  },
  '& .MuiInputLabel-root': { color: '#9ca3af', fontSize: 13 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#111827' }
}

function StatusBadge({ status }) {
  const map = {
    todo: { label: 'Todo', color: '#6b7280', bg: '#f3f4f6', icon: <RadioButtonUncheckedIcon sx={{ fontSize: 12 }} /> },
    'in-progress': { label: 'In Progress', color: '#92400e', bg: '#fef3c7', icon: <PendingOutlinedIcon sx={{ fontSize: 12 }} /> },
    done: { label: 'Done', color: '#166534', bg: '#dcfce7', icon: <CheckCircleOutlineIcon sx={{ fontSize: 12 }} /> }
  }
  const s = map[status] || map.todo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: '3px 9px', borderRadius: 20,
      border: `1px solid ${s.color}30`
    }}>
      {s.icon} {s.label}
    </span>
  )
}

export default function ChannelDetail() {
  const { id } = useParams()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const messagesEndRef = useRef(null)

  const [channel, setChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [tasks, setTasks] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [tab, setTab] = useState(0)
  const [members, setMembers] = useState([])

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)

  useEffect(() => {
    socket.emit('joinChannel', id)

    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    socket.on('task_update', () => {
      fetchTasks()
    })

    return () => {
      socket.off('newMessage')
      socket.off('task_update')
    }
  }, [id])

  useEffect(() => {
    fetchChannel()
    fetchMessages()
    fetchTasks()
    fetchMembers()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchChannel = async () => {
    try {
      const res = await axios.get(`${API_URL}/channels`, {
        headers: { Authorization: token }
      })
      setChannel(res.data.find(c => c._id === id))
    } catch (err) { console.error(err) }
  }

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/${id}`, {
        headers: { Authorization: token }
      })
      setMessages(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: token }
      })
      setTasks(Array.isArray(res.data?.tasks) ? res.data.tasks : [])
    } catch (err) { console.error(err) }
  }

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_URL}/channels/${id}/members`, {
        headers: { Authorization: token }
      })
      setMembers(res.data)
    } catch (err) { console.error(err) }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const msgData = {
      channelId: id,
      text: newMessage,
      sender: user,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, msgData])
    socket.emit('sendMessage', msgData)

    try {
      await axios.post(
        `${API_URL}/messages/send`,
        { channelId: id, text: newMessage },
        { headers: { Authorization: token } }
      )
    } catch (err) { console.error(err) }

    setNewMessage('')
  }

  const createTask = async () => {
    try {
      await axios.post(
        `${API_URL}/tasks/create`,
        {
          title: taskTitle,
          description: taskDesc,
          channelId: id,
          assignedTo: taskAssignee 
        },
        { headers: { Authorization: token } }
      )
      setTaskTitle('')
      setTaskDesc('')
      setTaskAssignee('')
      setShowTaskForm(false)
      fetchTasks()
    } catch (err) { console.error(err) }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/tasks/update/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: token } }
      )
      setTasks(prev => prev.map(task => (
        task._id === taskId ? { ...task, status: newStatus } : task
      )))
      fetchTasks()
    } catch (err) { console.error(err) }
  }

  const isMine = (msg) => msg.sender?._id === user._id || msg.sender === user._id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>

      <div style={{
        height: 48,
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 10,
        flexShrink: 0,
        background: '#ffffff'
      }}>
        <TagIcon sx={{ fontSize: 16, color: '#FFD600' }} />
        <span style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>
          {channel?.name || '…'}
        </span>
        {channel?.description && (
          <>
            <span style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 300 }}>|</span>
            <span style={{ color: '#9ca3af', fontSize: 12 }}>{channel.description}</span>
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <PersonOutlineIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>
            {channel?.members?.length || 0} members
          </span>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #e5e7eb', background: '#ffffff', flexShrink: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              color: '#9ca3af', textTransform: 'none', fontSize: 13,
              minHeight: 40, padding: '0 18px', fontWeight: 500
            },
            '& .Mui-selected': { color: '#111827 !important', fontWeight: 600 },
            '& .MuiTabs-indicator': { background: '#FFD600', height: 2 }
          }}
        >
          <Tab label="Chat" />
          <Tab label={`Tasks${Array.isArray(tasks) ? ` (${tasks.length})` : ''}`} />
        </Tabs>
      </div>
      {tab === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', gap: 4,
            background: '#f9fafb'
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#d1d5db' }}>
                <p style={{ fontSize: 13 }}>No messages yet. Say hello!</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const mine = isMine(msg)
              const senderName = msg.sender?.username || msg.sender?.name || 'Unknown'
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: mine ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    marginBottom: 2
                  }}
                >
                  {!mine && (
                    <Avatar sx={{
                      width: 28, height: 28, flexShrink: 0,
                      bgcolor: avatarColor(senderName),
                      fontSize: 12, fontWeight: 700, color: '#fff'
                    }}>
                      {initials(senderName)}
                    </Avatar>
                  )}

                  <div style={{ maxWidth: '68%' }}>
                    {!mine && (
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4, marginBottom: 3, display: 'block' }}>
                        {senderName}
                      </span>
                    )}
                    <div style={{
                      background: mine ? '#FFD600' : '#ffffff',
                      color: mine ? '#111827' : '#1f2937',
                      padding: '9px 13px',
                      borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      border: mine ? 'none' : '1px solid #e5e7eb',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}>
                      {msg.text || msg.content}
                    </div>
                    <span style={{
                      fontSize: 10, color: '#d1d5db',
                      display: 'block', marginTop: 3,
                      textAlign: mine ? 'right' : 'left',
                      paddingLeft: mine ? 0 : 4,
                      paddingRight: mine ? 4 : 0
                    }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5e7eb',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              flex: 1,
              background: '#f9fafb',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px 0 12px'
            }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`Message #${channel?.name || '…'}`}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  outline: 'none', color: '#111827', fontSize: 13.5,
                  padding: '10px 0'
                }}
              />
              <IconButton
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="small"
                sx={{
                  color: newMessage.trim() ? '#111827' : '#d1d5db',
                  background: newMessage.trim() ? '#FFD600' : 'transparent',
                  borderRadius: 1.5,
                  width: 32, height: 32,
                  '&:hover': { background: newMessage.trim() ? '#e6c200' : 'transparent' },
                  transition: 'all 0.15s'
                }}
              >
                <SendIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </div>
          </div>
        </div>
      )}
      {tab === 1 && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f9fafb' }}>
          <div style={{ marginBottom: 20 }}>
            {!showTaskForm ? (
              <button
                onClick={() => setShowTaskForm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#ffffff',
                  border: '1px dashed #d1d5db',
                  borderRadius: 8,
                  padding: '10px 16px',
                  color: '#9ca3af',
                  fontSize: 13,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.12s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#FFD600'
                  e.currentTarget.style.color = '#111827'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.color = '#9ca3af'
                }}
              >
                <AddTaskIcon sx={{ fontSize: 16 }} />
                Add a task
              </button>
            ) : (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderTop: '3px solid #FFD600',
                borderRadius: 10,
                padding: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <p style={{ color: '#111827', fontSize: 13, fontWeight: 700, margin: '0 0 14px' }}>
                  New Task
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <TextField
                    placeholder="Task title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    fullWidth size="small" sx={lightInputSx}
                  />
                  <TextField
                    placeholder="Description (optional)"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    fullWidth size="small" multiline rows={2} sx={lightInputSx}
                  />
                  <FormControl fullWidth size="small" sx={lightInputSx}>
                    <InputLabel>Assign to</InputLabel>
                    <Select
                      value={taskAssignee}
                      label="Assign to"
                      onChange={(e) => setTaskAssignee(e.target.value)}
                    >
                      {members.map(m => (
                        <MenuItem key={m._id} value={m._id} sx={{ fontSize: 13 }}>
                          {m.username}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      onClick={() => setShowTaskForm(false)}
                      style={{
                        background: '#ffffff', border: '1px solid #e5e7eb',
                        borderRadius: 6, padding: '6px 14px',
                        color: '#6b7280', fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createTask}
                      style={{
                        background: '#FFD600', border: 'none',
                        borderRadius: 6, padding: '6px 16px',
                        color: '#111827', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {Array.isArray(tasks) && tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map((task, i) => (
                <div
                  key={task._id || i}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    transition: 'box-shadow 0.12s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    {task.status === 'done'
                      ? <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                      : task.status === 'in-progress'
                        ? <PendingOutlinedIcon sx={{ fontSize: 18, color: '#d97706' }} />
                        : <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: '#d1d5db' }} />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 3px', fontSize: 14, fontWeight: 600,
                      color: task.status === 'done' ? '#9ca3af' : '#111827',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                        {task.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={task.status} />
                      {(task.assignedUser || task.assignedTo) && (
                        <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <PersonOutlineIcon sx={{ fontSize: 12 }} />
                          {task.assignedUser?.username || task.assignedTo || 'Unknown'}
                        </span>
                      )}
                    </div>
                  </div>

                  <Select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                    size="small"
                    sx={{
                      color: '#374151', fontSize: 12,
                      minWidth: 120, flexShrink: 0,
                      background: '#f9fafb',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
                      '& .MuiSvgIcon-root': { color: '#9ca3af' }
                    }}
                  >
                    <MenuItem value="todo" sx={{ fontSize: 12 }}>Todo</MenuItem>
                    <MenuItem value="in-progress" sx={{ fontSize: 12 }}>In Progress</MenuItem>
                    <MenuItem value="done" sx={{ fontSize: 12 }}>Done</MenuItem>
                  </Select>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 40, color: '#e5e7eb' }}>
              <AddTaskIcon sx={{ fontSize: 36, mb: 1 }} />
              <p style={{ fontSize: 13, margin: 0, color: '#9ca3af' }}>No tasks yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
