/**
 * Recording Calendar Component
 * 날짜별로 녹음본을 정리하여 보여주는 달력 컴포넌트
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Music } from 'lucide-react';
import { type Recording } from '../../types/recording';

interface RecordingCalendarProps {
  recordings: Recording[];
  selectedRecordings: string[];
  onToggleRecording: (recordingId: string) => void;
  onPlayRecording: (recordingId: string) => void;
  onDateClick?: (date: Date, recordings: Recording[]) => void;
  currentPlayingId?: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const RecordingCalendar: React.FC<RecordingCalendarProps> = ({
  recordings,
  selectedRecordings,
  onToggleRecording,
  onPlayRecording,
  onDateClick,
  currentPlayingId,
  loading = false,
  error = null,
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 녹음본을 날짜별로 그룹화
  const recordingsByDate = useMemo(() => {
    const groups: Record<string, Recording[]> = {};
    
    recordings.forEach((recording) => {
      const date = new Date(recording.createdAt);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(recording);
    });

    // 각 날짜별로 최신순 정렬
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return groups;
  }, [recordings]);

  // 현재 월의 날짜들 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // 이전 달의 빈 날짜들
    for (let i = 0; i < firstDayWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date: day,
        fullDate: date,
        dateKey,
        recordings: recordingsByDate[dateKey] || []
      });
    }
    
    return days;
  }, [currentDate, recordingsByDate]);

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-xl border-2 border-cyan-300/80 rounded-2xl p-6 h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-300 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">녹음본을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-xl border-2 border-red-300/80 rounded-2xl p-6 h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-red-300 mb-2">오류가 발생했습니다</p>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-xl border-2 border-cyan-300/80 rounded-2xl p-6 h-full flex flex-col shadow-2xl shadow-cyan-300/50 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-300" />
            녹음 달력
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs bg-cyan-300/20 text-cyan-300 rounded-lg hover:bg-cyan-300/30 transition-colors"
          >
            오늘
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          
          <h3 className="text-xl font-bold text-white">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-white/60 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 h-[calc(100%-60px)] overflow-y-auto">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-20" />;
            }

            const { date, recordings: dayRecordings } = day;
            const isToday = new Date().toDateString() === day.fullDate.toDateString();
            const hasRecordings = dayRecordings.length > 0;

            return (
              <div
                key={date}
                onClick={() => onDateClick?.(day.fullDate, dayRecordings)}
                className={`relative h-20 border border-white/10 rounded-lg p-2 cursor-pointer transition-all hover:bg-white/5 ${
                  isToday ? 'bg-cyan-300/20 border-cyan-300/50' : ''
                } ${hasRecordings ? 'bg-pink-300/10 border-pink-300/30' : ''}`}
              >
                {/* Date Number */}
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-cyan-300' : 'text-white/80'
                }`}>
                  {date}
                </div>

                {/* Recording Indicators */}
                {hasRecordings && (
                  <div className="flex flex-wrap gap-1">
                    {dayRecordings.slice(0, 3).map((recording) => {
                      const isSelected = selectedRecordings.includes(String(recording.id));
                      return (
                        <div
                          key={recording.id}
                          className={`w-2 h-2 rounded-full ${
                            isSelected 
                              ? 'bg-yellow-300' 
                              : 'bg-pink-300/60'
                          }`}
                          title={recording.song?.title || '제목 없음'}
                        />
                      );
                    })}
                    {dayRecordings.length > 3 && (
                      <div className="text-xs text-white/40">
                        +{dayRecordings.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-pink-300/60 rounded-full"></div>
              <span>녹음 있음</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span>선택됨</span>
            </div>
          </div>
          <div className="text-white/40">
            총 {recordings.length}개 녹음
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingCalendar;
