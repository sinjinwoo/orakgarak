const fs = require('fs');

// 압축 해제된 파일 읽기
const decompressedContent = fs.readFileSync('public/bundle_decompressed.js', 'utf8');

// 압축 (공백과 줄바꿈 제거)
const compressed = decompressedContent
    .replace(/\s+/g, ' ')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*,\s*/g, ',')
    .trim();

// 압축된 파일 저장
fs.writeFileSync('public/bundle.js', compressed);

console.log('Bundle.js 압축 완료!');
