'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import Image from 'next/image';
import dataset from '@/data/pesticides.json';

type TargetState = 'match' | 'unsure' | 'different';
type TimingState = 'recommended' | 'late' | 'other';
type MixState = 'none' | 'allowed-c' | 'allowed-bio' | 'blocked-ddvp' | 'blocked-phoxim';
type MeasureId = 'product-bottle' | 'cylinder-100' | 'cap-5' | 'paper-cup-200';

const product = dataset.products[0];

const targetImages = [
  { src: '/images/target-green-foxtail-real.jpg', label: '狗尾草（毛毛狗）' },
  { src: '/images/weed-crabgrass-real.jpg', label: '马唐（抓地龙）' },
  { src: '/images/weed-goosegrass-real.jpg', label: '牛筋草' },
  { src: '/images/weed-barnyardgrass-real.jpg', label: '稗草' },
];

const measureOptions: Array<{ id: MeasureId; name: string; shortName: string; capacityMl: number }> = [
  { id: 'product-bottle', name: '本品200毫升农药瓶', shortName: '本品农药瓶', capacityMl: 200 },
  { id: 'cylinder-100', name: '100毫升量筒', shortName: '100毫升量筒', capacityMl: 100 },
  { id: 'cap-5', name: '约5毫升矿泉水瓶盖', shortName: '瓶盖', capacityMl: 5 },
  { id: 'paper-cup-200', name: '200毫升一次性纸杯', shortName: '一次性纸杯', capacityMl: 200 },
];

const areaOptions = [0.5, 1, 2, 3, 5, 10];

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let line = '';
  let currentY = y;
  for (const character of text) {
    const nextLine = line + character;
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = character;
      currentY += lineHeight;
    } else {
      line = nextLine;
    }
  }
  if (line) context.fillText(line, x, currentY);
  return currentY + lineHeight;
}

export default function Home() {
  const [crop, setCrop] = useState('corn');
  const [target, setTarget] = useState<TargetState>('match');
  const [timing, setTiming] = useState<TimingState>('recommended');
  const [useCount, setUseCount] = useState(0);
  const [mixState, setMixState] = useState<MixState>('none');
  const [area, setArea] = useState(1);
  const [measureId, setMeasureId] = useState<MeasureId>('cap-5');

  const waterJin = area * 10;
  const medicineLiang = area;
  const medicineMl = area * 50;
  const measure = measureOptions.find((item) => item.id === measureId) ?? measureOptions[2];
  const measureCount = medicineMl / measure.capacityMl;

  const blockers = useMemo(() => {
    const reasons: string[] = [];
    if (crop !== 'corn') reasons.push('地里种的不是玉米');
    if (target === 'different') reasons.push('田里的杂草和图片不一样');
    if (target === 'unsure') reasons.push('还没有认准田里的杂草');
    if (timing !== 'recommended') reasons.push('已经错过适用时期');
    if (useCount >= 1) reasons.push('这一季已经用过1次');
    if (mixState === 'blocked-ddvp') reasons.push('不能和敌敌畏混配');
    if (mixState === 'blocked-phoxim') reasons.push('不能和辛硫磷混配');
    return reasons;
  }, [crop, mixState, target, timing, useCount]);

  const canUse = blockers.length === 0;
  const mixAnswer = mixState === 'blocked-ddvp' || mixState === 'blocked-phoxim'
    ? '不能混配'
    : mixState === 'none'
      ? '不混配'
      : '能混配';
  const equation = `${formatNumber(waterJin)}斤水＋${formatNumber(medicineLiang)}两药＝${formatNumber(measureCount)}个${measure.shortName}的量`;
  const themeStyle = { '--accent': product.accent } as CSSProperties;

  const saveResultImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#f4f0e5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = product.accent;
    context.fillRect(0, 0, canvas.width, 260);

    context.fillStyle = '#ffffff';
    context.font = '700 40px system-ui, sans-serif';
    context.fillText('玉米除草剂', 80, 90);
    context.font = '800 64px system-ui, sans-serif';
    context.fillText('玉净酮·禾封嗪', 80, 180);

    context.fillStyle = '#1f241d';
    context.font = '800 62px system-ui, sans-serif';
    context.fillText(`喷 ${formatNumber(area)} 亩`, 80, 380);
    context.fillStyle = product.accent;
    context.font = '800 58px system-ui, sans-serif';
    context.fillText(`${formatNumber(waterJin)}斤水 ＋ ${formatNumber(medicineLiang)}两药`, 80, 475);
    context.fillStyle = '#1f241d';
    context.font = '700 42px system-ui, sans-serif';
    drawWrappedText(context, `用${measure.name}量：${formatNumber(measureCount)}个容器的量`, 80, 560, 920, 62);

    context.strokeStyle = '#c8c2b5';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(80, 700);
    context.lineTo(1000, 700);
    context.stroke();

    context.font = '800 44px system-ui, sans-serif';
    context.fillText('注意事项', 80, 790);
    context.font = '500 34px system-ui, sans-serif';
    const notes = [
      '使用前充分摇匀，对着杂草茎叶喷匀。',
      '大风天或1小时内可能下雨时不要喷。',
      '穿长袖长裤，戴手套、口罩和护目镜。',
      '药液当天配、当天用完；一季最多使用1次。',
      '远离儿童和水体，剩余药放回原包装。',
    ];
    let y = 875;
    notes.forEach((note, index) => {
      context.fillText(`${index + 1}.`, 80, y);
      y = drawWrappedText(context, note, 135, y, 850, 54) + 20;
    });

    context.fillStyle = '#7b3f32';
    context.font = '700 25px system-ui, sans-serif';
    context.fillText('实验用虚构标签，禁止用于真实农业生产', 80, 1370);

    const link = document.createElement('a');
    link.download = `玉米除草剂-${formatNumber(area)}亩用药图.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <main className="app-shell" style={themeStyle}>
      <section className={`sticky-result ${canUse ? 'usable' : 'blocked'}`} aria-live="polite">
        <div className="use-answer">
          <span>能不能用？</span>
          <strong>{canUse ? '可以用' : '不能用'}</strong>
        </div>
        {canUse ? (
          <div className="top-dose">
            <span>喷 {formatNumber(area)} 亩</span>
            <strong>{equation}</strong>
          </div>
        ) : (
          <div className="top-dose">
            <span>先不要配药</span>
            <strong>{blockers[0]}</strong>
          </div>
        )}
      </section>

      <header className="product-header">
        <div>
          <span>PRODUCT A · 玉米除草剂</span>
          <h1>玉净酮·禾封嗪</h1>
        </div>
        <strong>一季最多1次</strong>
      </header>

      <section className="question-card situation-card">
        <h2>地里现在是什么情况？</h2>
        <div className="question-grid">
          <label>
            <span>种的是什么？</span>
            <select value={crop} onChange={(event) => setCrop(event.target.value)}>
              <option value="corn">玉米（默认）</option>
              <option value="other">不是玉米</option>
            </select>
          </label>
          <label>
            <span>杂草和下面图片一样吗？</span>
            <select value={target} onChange={(event) => setTarget(event.target.value as TargetState)}>
              <option value="match">一样（默认）</option>
              <option value="different">不一样</option>
              <option value="unsure">看不准</option>
            </select>
          </label>
          <label>
            <span>现在种了多久？</span>
            <select value={timing} onChange={(event) => setTiming(event.target.value as TimingState)}>
              <option value="recommended">刚开始种，不到1个月（玉米3—5叶、杂草2—4叶）</option>
              <option value="late">约1个月以上（玉米已有6片展开叶）</option>
              <option value="other">不在玉米生长期</option>
            </select>
          </label>
          <label>
            <span>这一季用过几次？</span>
            <select value={useCount} onChange={(event) => setUseCount(Number(event.target.value))}>
              <option value="0">0次（默认）</option>
              <option value="1">1次</option>
              <option value="2">2次或更多</option>
            </select>
          </label>
        </div>

        <div className="target-gallery" aria-label="适用杂草照片">
          {targetImages.map((item) => (
            <figure key={item.src}>
              <div><Image src={item.src} alt={item.label} fill sizes="(max-width: 640px) 50vw, 25vw" /></div>
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
        </div>
        <details className="target-details">
          <summary>看不准？点开看详情</summary>
          <p>{product.targetGuide.summary}</p>
        </details>
      </section>

      <section className="question-card dose-card">
        <h2>这次要喷多少亩？</h2>
        <div className="dose-selects">
          <label>
            <span>喷多少亩？</span>
            <select value={area} onChange={(event) => setArea(Number(event.target.value))}>
              {areaOptions.map((item) => <option key={item} value={item}>{item}亩</option>)}
            </select>
          </label>
          <label>
            <span>用什么量药？</span>
            <select value={measureId} onChange={(event) => setMeasureId(event.target.value as MeasureId)}>
              {measureOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
        <div className="dose-equation">
          <strong>{formatNumber(waterJin)}斤水</strong>
          <b>＋</b>
          <strong>{formatNumber(medicineLiang)}两药</strong>
          <b>＝</b>
          <strong>{formatNumber(measureCount)}个{measure.shortName}的量</strong>
        </div>
      </section>

      <section className="question-card mix-card">
        <h2>要和别的药一起用吗？</h2>
        <label>
          <span>选择另一种药</span>
          <select value={mixState} onChange={(event) => setMixState(event.target.value as MixState)}>
            <option value="none">不混配（默认）</option>
            <option value="allowed-c">任务中的玉米杀虫剂 C</option>
            <option value="allowed-bio">生物杀菌剂</option>
            <option value="blocked-ddvp">敌敌畏</option>
            <option value="blocked-phoxim">辛硫磷</option>
          </select>
        </label>
        <div className={`mix-answer ${mixAnswer === '不能混配' ? 'no' : 'yes'}`}>{mixAnswer}</div>
      </section>

      <section className="save-card">
        <div className="save-preview">
          <span>玉米除草剂</span>
          <h2>玉净酮·禾封嗪</h2>
          {canUse ? (
            <strong>喷{formatNumber(area)}亩：{formatNumber(waterJin)}斤水＋{formatNumber(medicineLiang)}两药</strong>
          ) : (
            <strong className="stop">当前情况不能用</strong>
          )}
          <ul>
            <li>使用前摇匀，对杂草茎叶喷匀</li>
            <li>大风或1小时内可能下雨时不喷</li>
            <li>穿长袖长裤，戴手套口罩和护目镜</li>
            <li>当天配、当天用完，一季最多1次</li>
          </ul>
        </div>
        <button type="button" onClick={saveResultImage} disabled={!canUse}>保存这张用药图</button>
      </section>

      <details className="label-details">
        <summary>查看完整标签详情</summary>
        <div>
          <p><strong>怎么喷：</strong>先加一半水，加药搅匀，再补足水；对杂草茎叶均匀喷雾，避开玉米心叶。</p>
          <p><strong>什么时候不用：</strong>玉米已有6片展开叶、大风天或1小时内可能下雨时不用。</p>
          <p><strong>安全：</strong>做好个人防护，远离儿童和水体，包装不得重复使用。</p>
        </div>
      </details>

      <footer>{dataset.disclaimer}</footer>
    </main>
  );
}
