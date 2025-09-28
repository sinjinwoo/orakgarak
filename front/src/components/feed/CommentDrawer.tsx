import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Send, Close, Person, Edit, Delete, Reply } from '@mui/icons-material';
import { useComments, useReplies } from '../../hooks/useSocial';
import { useAuth } from '../../hooks/useAuth';

interface CommentDrawerProps {
  open: boolean;
  onClose: () => void;
  albumId: number;
  albumTitle: string;
}

const CommentDrawer: React.FC<CommentDrawerProps> = ({
  open,
  onClose,
  albumId,
  albumTitle,
}) => {
  const { user } = useAuth();
  const { comments, isLoading, error, addComment, updateComment, deleteComment } = useComments(albumId);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const success = await addComment(newComment.trim());
      if (success) {
        setNewComment('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingContent.trim()) return;
    
    const success = await updateComment(commentId, editingContent.trim());
    if (success) {
      setEditingCommentId(null);
      setEditingContent('');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    
    const success = await deleteComment(commentId);
    if (success) {
    }
  };

  const startEditing = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}분 전`;
      }
      return `${hours}시간 전`;
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
            댓글
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
            <Close />
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{ 
          px: 2, 
          py: 1, 
          color: 'rgba(255, 255, 255, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {albumTitle}
        </Typography>

        {/* 댓글 목록 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" variant="body2">
                댓글을 불러오는데 실패했습니다.
              </Typography>
              <Typography color="error" variant="caption" display="block">
                {error}
              </Typography>
            </Box>
          ) : !comments?.content?.length ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                아직 댓글이 없습니다.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {comments.content.map((comment) => (
                <React.Fragment key={comment.id}>
                  <ListItem
                    sx={{ 
                      alignItems: 'flex-start',
                      px: 2,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                        <Person sx={{ fontSize: 20 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                            사용자 {comment.userId}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        editingCommentId === comment.id ? (
                          <Box sx={{ mt: 1 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  '& fieldset': { border: 'none' },
                                },
                                '& .MuiInputBase-input': { color: '#FFFFFF' },
                              }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleEditComment(comment.id)}
                                sx={{ minWidth: 'auto', px: 2 }}
                              >
                                저장
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={cancelEditing}
                                sx={{ minWidth: 'auto', px: 2 }}
                              >
                                취소
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.5 }}>
                              {comment.content}
                            </Typography>
                            {user && comment.userId === user.id && (
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                  size="small"
                                  startIcon={<Edit sx={{ fontSize: 16 }} />}
                                  onClick={() => startEditing(comment.id, comment.content)}
                                  sx={{ 
                                    minWidth: 'auto', 
                                    px: 1,
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': { color: '#FFFFFF' }
                                  }}
                                >
                                  수정
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<Delete sx={{ fontSize: 16 }} />}
                                  onClick={() => handleDeleteComment(comment.id)}
                                  sx={{ 
                                    minWidth: 'auto', 
                                    px: 1,
                                    color: 'rgba(255, 107, 107, 0.7)',
                                    '&:hover': { color: '#FF6B6B' }
                                  }}
                                >
                                  삭제
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )
                      }
                    />
                  </ListItem>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* 댓글 작성 */}
        {user && (
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="댓글을 작성하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '& fieldset': {
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(196, 71, 233, 0.5)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#FFFFFF',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.6)',
                      opacity: 1,
                    },
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                sx={{
                  minWidth: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                ) : (
                  <Send sx={{ fontSize: 20 }} />
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CommentDrawer;
