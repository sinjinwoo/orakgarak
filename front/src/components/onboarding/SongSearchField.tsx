import React, { useState } from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { songAPI } from '../../services/backend';

interface SongSearchFieldProps {
  onSongSelect?: (song: any) => void;
  placeholder?: string;
}

const SongSearchField: React.FC<SongSearchFieldProps> = ({
  onSongSelect,
  placeholder = '곡을 검색하세요...',
}) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    
    setLoading(true);
    try {
      const response = await songAPI.search(query, 10);
      setOptions(response.data);
    } catch (error) {
      console.error('곡 검색 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={(option) => 
          typeof option === 'string' ? option : `${option.title} - ${option.artist}`
        }
        loading={loading}
        onInputChange={(_, value) => handleSearch(value)}
        onChange={(_, value) => {
          if (value && typeof value !== 'string') {
            onSongSelect?.(value);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="body1">{option.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {option.artist}
              </Typography>
            </Box>
          </Box>
        )}
      />
    </Box>
  );
};

export default SongSearchField;
