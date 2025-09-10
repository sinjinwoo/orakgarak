import React, { useState } from 'react';
import { Search, Music, Clock, Album, User } from 'lucide-react';

// 타입 정의
interface LyricsRecord {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

interface SearchQueryParams {
  q?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
}

const LyricsSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<SearchQueryParams>({
    q: ''
  });
  
  const [lyrics, setLyrics] = useState<LyricsRecord | null>(null);
  const [searchResults, setSearchResults] = useState<LyricsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 키워드로 가사 검색하기
  const searchLyrics = async () => {
    const { q, trackName, artistName, albumName } = searchQuery;
    
    if (!q?.trim() && !trackName?.trim()) {
      setError('검색어 또는 트랙명 중 하나는 반드시 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const params = new URLSearchParams();
      if (q?.trim()) params.append('q', q);
      if (trackName?.trim()) params.append('track_name', trackName);
      if (artistName?.trim()) params.append('artist_name', artistName);
      if (albumName?.trim()) params.append('album_name', albumName);

      const response = await fetch(`https://lrclib.net/api/search?${params}`, {
        headers: {
          'User-Agent': 'LyricsSearchApp v1.0.0 (React App)'
        }
      });

      if (response.ok) {
        const data: LyricsRecord[] = await response.json();
        setSearchResults(data);
        if (data.length === 0) {
          setError('검색 결과가 없습니다.');
        }
      } else {
        setError('검색에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ID로 특정 가사 가져오기
  const fetchLyricsById = async (id: number) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://lrclib.net/api/get/${id}`, {
        headers: {
          'User-Agent': 'LyricsSearchApp v1.0.0 (React App)'
        }
      });

      if (response.ok) {
        const data: LyricsRecord = await response.json();
        setLyrics(data);
      } else {
        setError('가사를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 재생시간을 분:초 형태로 변환
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          가사 검색기
        </h1>
        
        {/* 키워드 검색 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                통합 검색어
              </label>
              <input
                type="text"
                value={searchQuery.q || ''}
                onChange={(e) => setSearchQuery(prev => ({...prev, q: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="트랙명, 아티스트명, 앨범명에서 통합 검색"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                아티스트명
              </label>
              <input
                type="text"
                value={searchQuery.artistName || ''}
                onChange={(e) => setSearchQuery(prev => ({...prev, artistName: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="아티스트명으로 검색"
              />
            </div>
          </div>
          
          <button
            onClick={searchLyrics}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={16} />
            {loading ? '검색 중...' : '키워드 검색'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">검색 결과</h2>
          <div className="grid gap-4">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => fetchLyricsById(result.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                      <Music size={16} className="text-blue-600" />
                      {result.trackName}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                      <User size={14} />
                      {result.artistName}
                    </p>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Album size={14} />
                      {result.albumName}
                    </p>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Clock size={14} />
                      {formatDuration(result.duration)}
                      {result.instrumental && <span className="bg-gray-200 px-2 py-1 rounded text-xs">연주곡</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가사 표시 */}
      {lyrics && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Music className="text-blue-600" />
              {lyrics.trackName}
            </h2>
            <p className="text-gray-600 flex items-center gap-2 mt-2">
              <User size={16} />
              {lyrics.artistName}
            </p>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Album size={16} />
              {lyrics.albumName}
            </p>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Clock size={16} />
              {formatDuration(lyrics.duration)}
              {lyrics.instrumental && <span className="bg-gray-200 px-2 py-1 rounded text-xs">연주곡</span>}
            </p>
          </div>

          {lyrics.instrumental ? (
            <div className="text-center py-8">
              <Music size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">이 곡은 연주곡입니다</p>
            </div>
          ) : (
            lyrics.plainLyrics && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">가사</h3>
                <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {lyrics.plainLyrics}
                  </pre>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default LyricsSearch;