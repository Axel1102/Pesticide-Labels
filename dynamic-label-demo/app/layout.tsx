import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A、B、C 动态农药标签',
  description: '按信息类型查看三款实验农药的适用对象、使用方法、个性化用量和安全信息。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
