'use client';

import { type CSSProperties, useState } from 'react';
import Image from 'next/image';
import dataset from '@/data/pesticides.json';

type TargetState = 'match' | 'unsure' | 'different';
type TimingState = 'recommended' | 'late' | 'other';

const areaOptions = [0.5, 1, 2, 3, 5, 10];
const productTargetImages: Record<string, Array<{ src: string; label: string }>> = {
  'product-a': [
    { src: '/images/target-green-foxtail-real.jpg', label: '狗尾草（毛毛狗）' },
    { src: '/images/weed-crabgrass-real.jpg', label: '马唐（抓地龙）' },
    { src: '/images/weed-goosegrass-real.jpg', label: '牛筋草' },
    { src: '/images/weed-barnyardgrass-real.jpg', label: '稗草' },
  ],
  'product-b': [{ src: '/images/target-wheat-powdery-mildew-real.jpg', label: '小麦白粉病' }],
  'product-c': [{ src: '/images/target-asian-corn-borer-real.jpg', label: '玉米螟（钻心虫）' }],
};

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
  const [productId, setProductId] = useState(dataset.products[0].id);
  const [cropState, setCropState] = useState<'match' | 'other'>('match');
  const [target, setTarget] = useState<TargetState>('match');
  const [timing, setTiming] = useState<TimingState>('recommended');
  const [useCount, setUseCount] = useState(0);
  const [intervalOkay, setIntervalOkay] = useState(true);
  const [mixValue, setMixValue] = useState('none');
  const [area, setArea] = useState(1);
  const [measureId, setMeasureId] = useState('cap-10');

  const product = dataset.products.find((item) => item.id === productId) ?? dataset.products[0];
  const targetImages = productTargetImages[product.id] ?? [{ src: product.targetGuide.image, label: product.target }];
  const waterLiters = area * 5;
  const waterJin = waterLiters * 2;
  const medicineMl = (waterLiters / product.dosage.tankLiters) * product.dosage.recommendedAmountMl;
  const measuringOptions = dataset.measuringContainers.filter((item) => item.id !== 'custom-measuring');
  const selectedMeasure = measuringOptions.find((item) => item.id === measureId) ?? measuringOptions[4];
  const measureCapacity = selectedMeasure.id === 'product-bottle'
    ? product.dosage.bottleVolumeMl
    : selectedMeasure.capacityMl;
  const measureCount = medicineMl / measureCapacity;
  const measureName = selectedMeasure.id === 'product-bottle'
    ? `本品${product.dosage.bottleVolumeMl} mL农药瓶`
    : selectedMeasure.name;
  const measureResult = selectedMeasure.kind === 'cap'
    ? `约${formatNumber(measureCount)}盖`
    : medicineMl <= measureCapacity
      ? `量至${formatNumber(medicineMl)} mL刻度`
      : `${formatNumber(measureCount)}个${measureName}的量`;

  const blockers: string[] = [];
  if (cropState !== 'match') blockers.push(`地里种的不是${product.crop}`);
  if (target === 'different') blockers.push(`田里的对象不是${product.target}`);
  if (target === 'unsure') blockers.push(`还没有认准${product.target}`);
  if (timing !== 'recommended') blockers.push(`不在“${product.applicationTiming.recommended}”的适用时期`);
  if (useCount >= product.limits.maxUsesPerSeason) blockers.push(`本季最多使用${product.limits.maxUsesPerSeason}次`);
  if (
    product.limits.minimumIntervalDays
    && useCount > 0
    && useCount < product.limits.maxUsesPerSeason
    && !intervalOkay
  ) blockers.push(`距上次使用还不满${product.limits.minimumIntervalDays}天`);
  if (mixValue.startsWith('blocked:')) blockers.push(`不能与${mixValue.slice('blocked:'.length)}混配`);

  const canUse = blockers.length === 0;
  const mixAnswer = mixValue.startsWith('blocked:')
    ? '不能混配'
    : mixValue === 'none' ? '不混配' : '未列为禁配';
  const equation = `${formatNumber(waterJin)}斤水＋${formatNumber(medicineMl)} mL药＝${measureResult}`;
  const themeStyle = { '--accent': product.accent } as CSSProperties;

  const chooseProduct = (nextProductId: string) => {
    setProductId(nextProductId);
    setCropState('match');
    setTarget('match');
    setTiming('recommended');
    setUseCount(0);
    setIntervalOkay(true);
    setMixValue('none');
  };

  const saveResultImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#f4f0e5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = product.accent;
    context.fillRect(0, 0, canvas.width, 280);
    context.fillStyle = '#ffffff';
    context.font = '700 38px system-ui, sans-serif';
    context.fillText(`实验农药 ${product.code} · ${product.shortName}`, 80, 82);
    context.font = '800 58px system-ui, sans-serif';
    drawWrappedText(context, product.productName, 80, 165, 920, 68);

    context.fillStyle = '#1f241d';
    context.font = '800 60px system-ui, sans-serif';
    context.fillText(`喷 ${formatNumber(area)} 亩`, 80, 400);
    context.fillStyle = product.accent;
    context.font = '800 54px system-ui, sans-serif';
    context.fillText(`${formatNumber(waterJin)}斤水 ＋ ${formatNumber(medicineMl)} mL药`, 80, 490);
    context.fillStyle = '#1f241d';
    context.font = '700 39px system-ui, sans-serif';
    drawWrappedText(context, `用${measureName}量：${measureResult}`, 80, 575, 920, 58);

    context.strokeStyle = '#c8c2b5';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(80, 710);
    context.lineTo(1000, 710);
    context.stroke();
    context.font = '800 42px system-ui, sans-serif';
    context.fillText('用药提醒', 80, 795);
    context.font = '500 31px system-ui, sans-serif';
    const notes = [
      `${product.crop}·${product.target}：${product.applicationTiming.recommended}`,
      `${product.dosage.standardLabel}，${product.dosage.applicationMethod}`,
      ...product.fullLabel.precautions.slice(0, 2),
      `本季最多${product.limits.maxUsesPerSeason}次${product.limits.minimumIntervalDays ? `，每次至少间隔${product.limits.minimumIntervalDays}天` : ''}`,
    ];
    let y = 875;
    notes.forEach((note, index) => {
      context.fillText(`${index + 1}.`, 80, y);
      y = drawWrappedText(context, note, 135, y, 850, 50) + 16;
    });
    context.fillStyle = '#7b3f32';
    context.font = '700 25px system-ui, sans-serif';
    context.fillText('实验用虚构标签，禁止用于真实农业生产', 80, 1370);

    const link = document.createElement('a');
    link.download = `实验农药${product.code}-${formatNumber(area)}亩用药图.png`;
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
            <span>实验农药 {product.code} · 喷 {formatNumber(area)} 亩</span>
            <strong>{equation}</strong>
          </div>
        ) : (
          <div className="top-dose">
            <span>先不要配药</span>
            <strong>{blockers[0]}</strong>
          </div>
        )}
      </section>

      <nav className="product-switcher" aria-label="选择实验农药">
        <span>选择实验农药</span>
        <div>
          {dataset.products.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === product.id ? 'active' : ''}
              aria-pressed={item.id === product.id}
              onClick={() => chooseProduct(item.id)}
            >
              <b>{item.code}</b><small>{item.shortName}</small>
            </button>
          ))}
        </div>
      </nav>

      <header className="product-header">
        <div>
          <span>PRODUCT {product.code} · {product.crop} · {product.target}</span>
          <h1>{product.productName}</h1>
        </div>
        <strong>本季最多{product.limits.maxUsesPerSeason}次</strong>
      </header>

      <section className="question-card situation-card">
        <h2>地里现在是什么情况？</h2>
        <div className="question-grid">
          <label>
            <span>种的是什么？</span>
            <select value={cropState} onChange={(event) => setCropState(event.target.value as 'match' | 'other')}>
              <option value="match">{product.crop}（默认）</option>
              <option value="other">不是{product.crop}</option>
            </select>
          </label>
          <label>
            <span>要防治的是{product.target}吗？</span>
            <select value={target} onChange={(event) => setTarget(event.target.value as TargetState)}>
              <option value="match">是（默认）</option>
              <option value="different">不是</option>
              <option value="unsure">看不准</option>
            </select>
          </label>
          <label>
            <span>现在到什么时期？</span>
            <select value={timing} onChange={(event) => setTiming(event.target.value as TimingState)}>
              <option value="recommended">{product.applicationTiming.options[0]}（推荐）</option>
              <option value="late">{product.applicationTiming.options[1]}</option>
              <option value="other">{product.applicationTiming.options[2]}</option>
            </select>
          </label>
          <label>
            <span>这一季已经用过几次？</span>
            <select value={useCount} onChange={(event) => setUseCount(Number(event.target.value))}>
              {Array.from({ length: product.limits.maxUsesPerSeason + 1 }, (_, index) => (
                <option key={index} value={index}>{index}次{index === 0 ? '（默认）' : ''}</option>
              ))}
              <option value={product.limits.maxUsesPerSeason + 1}>{product.limits.maxUsesPerSeason + 1}次或更多</option>
            </select>
          </label>
          {product.limits.minimumIntervalDays && useCount > 0 && useCount < product.limits.maxUsesPerSeason ? (
            <label>
              <span>距上次用药满{product.limits.minimumIntervalDays}天了吗？</span>
              <select value={intervalOkay ? 'yes' : 'no'} onChange={(event) => setIntervalOkay(event.target.value === 'yes')}>
                <option value="yes">已经满{product.limits.minimumIntervalDays}天（默认）</option>
                <option value="no">还不满{product.limits.minimumIntervalDays}天</option>
              </select>
            </label>
          ) : null}
        </div>

        <div className={`target-gallery ${targetImages.length === 1 ? 'single' : ''}`} aria-label={`${product.target}参考照片`}>
          {targetImages.map((item) => (
            <figure key={item.src}>
              <div><Image src={item.src} alt={item.label} fill sizes="(max-width: 640px) 100vw, 25vw" /></div>
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
          <div className="target-signs">
            <strong>{product.targetGuide.plainTitle}</strong>
            <ul>{product.targetGuide.localExamples.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <details className="target-details">
          <summary>看不准？点开看识别要点</summary>
          <p>{product.targetGuide.summary}</p>
          <ul>{product.targetGuide.lookFor.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="caution">{product.targetGuide.caution}</p>
        </details>
      </section>

      <section className="question-card dose-card">
        <h2>这次要喷多少亩？</h2>
        <p className="label-dose">{product.dosage.standardLabel}，本页按推荐量 {product.dosage.recommendedAmountMl} mL / {product.dosage.tankLiters} L 水换算</p>
        <div className="dose-selects">
          <label>
            <span>喷多少亩？</span>
            <select value={area} onChange={(event) => setArea(Number(event.target.value))}>
              {areaOptions.map((item) => <option key={item} value={item}>{item}亩</option>)}
            </select>
          </label>
          <label>
            <span>用什么量药？</span>
            <select value={selectedMeasure.id} onChange={(event) => setMeasureId(event.target.value)}>
              {measuringOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id === 'product-bottle' ? `本品${product.dosage.bottleVolumeMl} mL农药瓶` : item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="dose-equation">
          <strong>{formatNumber(waterJin)}斤水</strong><b>＋</b>
          <strong>{formatNumber(medicineMl)} mL药</strong><b>＝</b>
          <strong>{measureResult}</strong>
        </div>
      </section>

      <section className="question-card mix-card">
        <h2>要和别的药一起用吗？</h2>
        <label>
          <span>选择另一种药（禁配类别：{product.mixing.restrictedCategory}）</span>
          <select value={mixValue} onChange={(event) => setMixValue(event.target.value)}>
            <option value="none">不混配（默认）</option>
            {product.mixing.notExplicitlyRestrictedExamples.map((item) => (
              <option key={item} value={`allowed:${item}`}>{item}（未列为禁配）</option>
            ))}
            {product.mixing.restrictedExamples.map((item) => (
              <option key={item} value={`blocked:${item}`}>{item}（禁止混配）</option>
            ))}
          </select>
        </label>
        <div className={`mix-answer ${mixValue.startsWith('blocked:') ? 'no' : 'yes'}`}>{mixAnswer}</div>
      </section>

      <section className="save-card">
        <div className="save-preview">
          <span>实验农药 {product.code} · {product.shortName}</span>
          <h2>{product.productName}</h2>
          {canUse ? (
            <strong>喷{formatNumber(area)}亩：{formatNumber(waterJin)}斤水＋{formatNumber(medicineMl)} mL药</strong>
          ) : <strong className="stop">当前情况不能用</strong>}
          <ul>
            <li>{product.applicationTiming.recommended}</li>
            <li>{product.dosage.applicationMethod}</li>
            <li>本季最多{product.limits.maxUsesPerSeason}次{product.limits.minimumIntervalDays ? `，至少间隔${product.limits.minimumIntervalDays}天` : ''}</li>
            <li>{product.fullLabel.precautions[0]}</li>
          </ul>
        </div>
        <button type="button" onClick={saveResultImage} disabled={!canUse}>保存这张用药图</button>
      </section>

      <details className="label-details">
        <summary>查看{product.code}款完整标签详情</summary>
        <div>
          <p><strong>作物与对象：</strong>{product.crop} · {product.target}</p>
          <p><strong>性能：</strong>{product.fullLabel.performance}</p>
          <p><strong>怎么喷：</strong>{product.dosage.applicationMethod}</p>
          <p><strong>时期与剂量：</strong>{product.fullLabel.technicalRequirements.join('；')}</p>
          <p><strong>安全：</strong>{product.fullLabel.precautions.join('；')}</p>
        </div>
      </details>

      <footer>{dataset.disclaimer}</footer>
    </main>
  );
}
