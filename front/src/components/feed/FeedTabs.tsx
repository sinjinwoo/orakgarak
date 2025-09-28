
import React from "react";
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { FilterList } from "@mui/icons-material";

interface FeedTabsProps {
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  sortBy: string;
  onSortChange: (event: SelectChangeEvent<string>) => void;
  albumCount: number;
  isInitialized: boolean;
}

const FeedTabs: React.FC<FeedTabsProps> = ({
  tabValue,
  onTabChange,
  sortBy,
  onSortChange,
  albumCount,
  isInitialized,
}) => {
  return (
    <Box
      sx={{
        position: "sticky",
        top: "80px", // Header height (60px) + margin (10px) + extra margin (10px)
        zIndex: 1000,
        backgroundColor: "rgba(26, 26, 46, 0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(236, 72, 153, 0.3)",
        py: 2,
        opacity: isInitialized ? 1 : 0,
        transform: isInitialized ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s ease",
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: "1400px", mx: "auto" }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          <Tabs
            value={tabValue}
            onChange={onTabChange}
            centered
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: "rgba(0, 255, 255, 0.2)",
              "& .MuiTabs-indicator": {
                background: "linear-gradient(45deg, #00ffff, #ff0080)",
                height: 3,
                borderRadius: "3px 3px 0 0",
                boxShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
              },
            }}
          >
            <Tab
              label="전체 피드"
              sx={{
                color: "#B3B3B3",
                "&.Mui-selected": { color: "#FFFFFF" },
              }}
            />
            <Tab
              label="팔로잉"
              sx={{
                color: "#B3B3B3",
                "&.Mui-selected": { color: "#FFFFFF" },
              }}
            />
          </Tabs>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: "#00ffff", fontWeight: 500 }}
            >
              {albumCount}개 앨범
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FilterList sx={{ color: "#00ffff" }} />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={sortBy}
                  onChange={onSortChange}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "rgba(0, 255, 255, 0.05)",
                    color: "#FFFFFF",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 255, 255, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 255, 255, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 255, 255, 0.7)",
                    },
                    "& .MuiSvgIcon-root": { color: "#00ffff" },
                  }}
                >
                  <MenuItem value="latest">최신순</MenuItem>
                  <MenuItem value="name">이름순</MenuItem>
                  <MenuItem value="likeCount">좋아요순</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default FeedTabs;
