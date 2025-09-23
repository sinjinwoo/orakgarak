/**
 * 이미지 업로드 섹션 컴포넌트
 * 드래그 앤 드롭, 파일 선택, 이미지 크롭 기능 제공
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, Check, Crop, RotateCw, Move, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { uploadCover } from '../../services/api/cover';
import { useAlbumMetaStore } from '../../stores/albumMetaStore';

interface ImageUploadSectionProps {
    onUploadComplete?: (imageUrl: string) => void;
    className?: string;
}

interface CropOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
                                                                   onUploadComplete,
                                                                   className = '',
                                                               }) => {
    const { setCoverUpload } = useAlbumMetaStore();
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropOptions, setCropOptions] = useState<CropOptions>({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        scale: 1,
    });
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        // 파일 유효성 검사
        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            setError('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        setError(null);
        setIsUploading(true);

        try {
            // 로컬 미리보기를 위한 URL 생성
            const localUrl = URL.createObjectURL(file);
            setUploadedImage(localUrl);

            // 실제 업로드 처리
            const result = await uploadCover(file);
            setCoverUpload(result.imageUrl, result.uploadId);
            onUploadComplete?.(result.imageUrl);
        } catch (error) {
            console.error('업로드 실패:', error);
            setError('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsUploading(false);
        }
    }, [setCoverUpload, onUploadComplete]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));

        if (imageFile) {
            handleFileSelect(imageFile);
        } else {
            setError('이미지 파일을 드롭해주세요.');
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleRemoveImage = useCallback(() => {
        setUploadedImage(null);
        setCoverUpload('',undefined);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [setCoverUpload]);

    const handleCropSave = useCallback(() => {
        // 실제 크롭 처리는 서버나 canvas API를 사용
        setShowCropModal(false);
    }, []);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* 업로드 영역 */}
            {!uploadedImage ? (
                <motion.div
                    className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
            ${isDragOver
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-white/20 hover:border-purple-400/50 hover:bg-white/5'
                    }
          `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                        aria-label="이미지 파일 선택"
                    />

                    <motion.div
                        animate={{
                            scale: isDragOver ? 1.1 : 1,
                            rotate: isDragOver ? 5 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={`
              w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors
              ${isDragOver ? 'bg-purple-500/20' : 'bg-white/10'}
            `}>
                            <Upload className={`w-8 h-8 ${isDragOver ? 'text-purple-400' : 'text-white/60'}`} />
                        </div>
                    </motion.div>

                    <h3 className="text-lg font-semibold text-white mb-2">
                        이미지를 드래그하거나 클릭해서 업로드
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                        JPG, PNG, WebP 형식 지원 (최대 10MB)
                    </p>

                    {isUploading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2 text-purple-400"
                        >
                            <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                            <span className="text-sm">업로드 중...</span>
                        </motion.div>
                    )}

                    {/* 드래그 오버레이 */}
                    <AnimatePresence>
                        {isDragOver && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-purple-500/10 backdrop-blur-sm rounded-xl border-2 border-purple-400 flex items-center justify-center"
                            >
                                <div className="text-purple-400 text-lg font-semibold">
                                    이미지를 여기에 놓으세요
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ) : (
                /* 업로드된 이미지 미리보기 */
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                >
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                                <img
                                    src={uploadedImage}
                                    alt="업로드된 이미지"
                                    className="w-32 h-32 object-cover rounded-lg"
                                />
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                                    aria-label="이미지 제거"
                                >
                                    <X size={14} className="text-white" />
                                </button>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <Check size={16} className="text-green-400" />
                                    <h4 className="font-semibold text-white">이미지 업로드 완료</h4>
                                </div>
                                <p className="text-white/60 text-sm mb-4">
                                    이미지를 편집하여 최적의 앨범 커버로 만들어보세요
                                </p>

                                {/* 편집 옵션 */}
                                <div className="flex gap-2">
                                    <motion.button
                                        onClick={() => setShowCropModal(true)}
                                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-colors flex items-center gap-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Crop size={16} />
                                        크롭/편집
                                    </motion.button>

                                    <motion.button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm font-medium transition-colors flex items-center gap-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <ImageIcon size={16} />
                                        다른 이미지
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 오류 메시지 */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                        <AlertCircle size={16} className="text-red-400" />
                        <span className="text-red-400 text-sm flex-1">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400/60 hover:text-red-400 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 크롭 모달 */}
            <AnimatePresence>
                {showCropModal && uploadedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCropModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">이미지 편집</h3>
                                <button
                                    onClick={() => setShowCropModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            </div>

                            {/* 이미지 편집 영역 */}
                            <div className="space-y-6">
                                <div className="bg-black/50 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                                    <img
                                        src={uploadedImage}
                                        alt="편집할 이미지"
                                        className="max-w-full max-h-[300px] object-contain"
                                        style={{
                                            transform: `scale(${cropOptions.scale}) rotate(${cropOptions.rotation}deg)`,
                                        }}
                                    />
                                </div>

                                {/* 편집 컨트롤 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-white/70 text-sm mb-2">회전</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCropOptions(prev => ({ ...prev, rotation: prev.rotation - 90 }))}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    <RotateCw size={16} className="text-white transform scale-x-[-1]" />
                                                </button>
                                                <span className="text-white/60 text-sm flex-1 text-center">
                          {cropOptions.rotation}°
                        </span>
                                                <button
                                                    onClick={() => setCropOptions(prev => ({ ...prev, rotation: prev.rotation + 90 }))}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    <RotateCw size={16} className="text-white" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-white/70 text-sm mb-2">크기</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCropOptions(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    <ZoomOut size={16} className="text-white" />
                                                </button>
                                                <span className="text-white/60 text-sm flex-1 text-center">
                          {Math.round(cropOptions.scale * 100)}%
                        </span>
                                                <button
                                                    onClick={() => setCropOptions(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    <ZoomIn size={16} className="text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-white/70 text-sm mb-2">위치 조정</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {[...Array(9)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center justify-center"
                                                        onClick={() => {
                                                            const row = Math.floor(i / 3);
                                                            const col = i % 3;
                                                            setCropOptions(prev => ({
                                                                ...prev,
                                                                x: (col - 1) * 25,
                                                                y: (row - 1) * 25,
                                                            }));
                                                        }}
                                                    >
                                                        {i === 4 && <Move size={12} className="text-white/60" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 액션 버튼 */}
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <motion.button
                                        onClick={handleCropSave}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        편집 적용
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setShowCropModal(false)}
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 font-semibold transition-colors"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        취소
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageUploadSection;