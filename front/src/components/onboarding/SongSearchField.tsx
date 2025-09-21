import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, Box, Typography } from "@mui/material";
import { useSongSearch } from "../../hooks/useSong";
import { Song } from "../../types/song";

interface SongSearchFieldProps {
  onSongSelect?: (song: Song) => void;
  placeholder?: string;
}

const SongSearchField: React.FC<SongSearchFieldProps> = ({
  onSongSelect,
  placeholder = "곡을 검색하세요...",
}) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");

  // 디바운스를 위한 지연 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 2) {
        setSearchKeyword(inputValue);
      } else {
        setSearchKeyword("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const {
    data: songs = [],
    isLoading,
    error,
  } = useSongSearch(searchKeyword, searchKeyword.length >= 2);

  return (
    <Box sx={{ width: "100%", maxWidth: 400 }}>
      <Autocomplete
        freeSolo
        options={songs}
        getOptionLabel={(option) =>
          typeof option === "string"
            ? option
            : `${option.songName} - ${option.artistName}`
        }
        loading={isLoading}
        onInputChange={(_, value) => setInputValue(value)}
        onChange={(_, value) => {
          if (value && typeof value !== "string") {
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {option.albumCoverUrl && (
                <img
                  src={option.albumCoverUrl}
                  alt={option.albumName}
                  style={{ width: 40, height: 40, borderRadius: 4 }}
                />
              )}
              <Box>
                <Typography variant="body1">{option.songName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.artistName} • {option.albumName}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      />
    </Box>
  );
};

export default SongSearchField;
