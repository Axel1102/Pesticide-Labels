'use client';

import { type CSSProperties, type ReactNode, useState } from 'react';
import Image from 'next/image';
import dataset from '@/data/pesticides.json';

type SectionId = 'suitability' | 'repeat' | 'dose' | 'operation' | 'mixing' | 'restrictions' | 'safety';
type TargetVisual = {
  label: string;
  image: string;
  imageAlt: string;
  damageImage?: string;
  damageImageAlt?: string;
};

const areaOptions = [0.5, 1, 2, 3, 5, 10];
const waterLitersPerMu = 30;
const pressureOptions = [
  { id: 'less', label: '少', adjustmentMl: -5 },
  { id: 'same', label: '差不多', adjustmentMl: 0 },
  { id: 'more', label: '多', adjustmentMl: 5 },
];
const historyOptions = [
  { id: 'never', label: '没用过', adjustmentMl: -5 },
  { id: 'one', label: '用过1季', adjustmentMl: 0 },
  { id: 'two', label: '用过2季', adjustmentMl: 0 },
  { id: 'years', label: '用了好几年', adjustmentMl: 0 },
];
const effectOptions = [
  { id: 'good', label: '效果好', adjustmentMl: 0 },
  { id: 'same', label: '一般', adjustmentMl: 0 },
  { id: 'poor', label: '效果不好', adjustmentMl: 5 },
];

const cropVisuals: Record<string, { image: string; alt: string }> = {
  'product-a': { image: '/images/crop-mature-corn-field-v2.png', alt: '成熟玉米地' },
  'product-b': { image: '/images/crop-mature-wheat-field-v2.png', alt: '成熟小麦地' },
  'product-c': { image: '/images/crop-mature-corn-field-v2.png', alt: '成熟玉米地' },
};

const targetsByProduct: Record<string, TargetVisual[]> = {
  'product-a': [
    { label: '狗尾草', image: '/images/target-green-foxtail-real.jpg', imageAlt: '狗尾草' },
    { label: '马唐', image: '/images/weed-crabgrass-whole-real-v2.jpg', imageAlt: '马唐整株' },
    { label: '牛筋草', image: '/images/weed-goosegrass-real.jpg', imageAlt: '牛筋草' },
    { label: '稗草', image: '/images/weed-barnyardgrass-real.jpg', imageAlt: '稗草' },
  ],
  'product-b': [
    { label: '小麦白粉病', image: '/images/target-wheat-powdery-mildew-real.jpg', imageAlt: '小麦白粉病' },
  ],
  'product-c': [
    { label: '玉米螟（钻心虫）', image: '/images/target-asian-corn-borer-real.jpg', imageAlt: '玉米螟幼虫', damageImage: '/images/target-asian-corn-borer-damage.webp', damageImageAlt: '玉米螟造成的叶片小孔和虫粪' },
  ],
};

const timingByProduct: Record<string, { text: string; parts?: string[] }> = {
  'product-a': { text: '', parts: ['玉米长到3–5片叶时', '杂草长到2–4片叶时'] },
  'product-b': { text: '白粉病还没出现或刚出现时' },
  'product-c': { text: '虫卵大量孵化、幼虫还小时' },
};

const operationSprayByProduct: Record<string, { image: string; label: string }> = {
  'product-a': { image: '/images/operation-spray-weeds-mono-v3.png', label: '只喷杂草茎叶，避开玉米心叶' },
  'product-b': { image: '/images/operation-spray-wheat-mono-v3.png', label: '喷小麦的茎和叶' },
  'product-c': { image: '/images/operation-spray-corn-whorl-mono-v3.png', label: '重点喷玉米心叶和受害处' },
};

const operationSteps = [
  { image: '/images/operation-shake-mono-v3.png', label: '充分摇匀' },
  { image: '/images/operation-half-water-mono-v3.png', label: '先加一半清水' },
  { image: '/images/operation-add-medicine-mono-v3.png', label: '加入量好的药，搅匀' },
  { image: '/images/operation-fill-water-mono-v3.png', label: '补水到30斤' },
  { image: '/images/operation-use-within-12h-mono-v3.png', label: '尽快用完，不超过12小时' },
];

const packageImages: Record<string, { image: string; alt: string; clue: string }> = {
  '辛硫磷': { image: '/images/phoxim-single-bottle-real-v2.png', alt: '辛硫磷常见包装', clue: '包装正面找“辛硫磷”' },
  '敌敌畏': { image: '/images/dichlorvos-product-photo-cutout.png', alt: '敌敌畏常见包装', clue: '包装正面找“敌敌畏”' },
  '波尔多液': { image: '/images/bordeaux-mixture-product-real.jpg', alt: '波尔多液常见包装', clue: '包装正面找“波尔多液”' },
  '氢氧化铜制剂': { image: '/images/copper-hydroxide-product-real.jpg', alt: '氢氧化铜制剂常见包装', clue: '有效成分找“氢氧化铜”' },
  '石硫合剂': { image: '/images/lime-sulfur-product-real.jpg', alt: '石硫合剂常见包装', clue: '包装正面找“石硫合剂”' },
};

const measureImages: Record<string, string> = {
  'cap-10': '/images/nongfu-cap-photo-cutout.png',
  'paper-cup-200': '/images/paper-cup-photo-cutout.png',
  'product-bottle': '/images/pesticide-liquid-bottle-photo-cutout.png',
  'cylinder-100': '/images/graduated-cylinder-photo-cutout.png',
};

const waterContainerOptions = [
  { id: 'sprayer-15', name: '15升喷雾器', capacityLiters: 15, image: '/images/sprayer-15l-real-cropped.jpg', unit: '壶' },
  { id: 'water-jug-5', name: '5升大矿泉水桶', capacityLiters: 5, image: '/images/nongfu-water-bottle-5l-cutout.png', unit: '桶' },
];

const safetyItems = [
  { symbol: '🧤', label: '戴手套' },
  { symbol: '😷', label: '戴口罩' },
  { symbol: '🚭', label: '不吃喝、不抽烟' },
  { symbol: '🚿', label: '用后清洗' },
];

const restrictionsByProduct: Record<string, Array<{ symbol: string; label: string; text: string }>> = {
  'product-a': [
    { symbol: '🌧️', label: '天气', text: '大风或1小时内要下雨：不能用' },
    { symbol: '🌾', label: '旁边作物', text: '药液不能飘到小麦、蔬菜等作物' },
    { symbol: '🌽', label: '玉米时期', text: '玉米长出5片叶以后不能用' },
    { symbol: '🌱', label: '后续种植', text: '使用后60天内不能改种或套种小麦、蔬菜' },
  ],
  'product-b': [
    { symbol: '🌧️', label: '天气', text: '大风或很快要下雨：不能用' },
    { symbol: '💧', label: '水体', text: '水产养殖区、河塘等水体附近不能用' },
    { symbol: '🐝', label: '敏感对象', text: '蜜源作物开花时、桑园附近不能用' },
  ],
  'product-c': [
    { symbol: '🌧️', label: '天气', text: '大风或很快要下雨：不能用' },
    { symbol: '💧', label: '周围环境', text: '河沟、池塘、桑园附近不能用' },
    { symbol: '🐝', label: '敏感对象', text: '蜜源作物开花时不能用' },
    { symbol: '🐛', label: '虫子时期', text: '幼虫钻进玉米秆后不建议再用' },
  ],
};

function AccordionItem({ id, title, hint, activeId, onToggle, children }: {
  id: SectionId;
  title: string;
  hint?: string;
  activeId: SectionId | null;
  onToggle: (id: SectionId) => void;
  children: ReactNode;
}) {
  const isOpen = activeId === id;
  return <section className={`accordion-item ${isOpen ? 'open' : ''}`}>
    <button className="accordion-trigger" type="button" aria-expanded={isOpen} aria-controls={`panel-${id}`} onClick={() => onToggle(id)}>
      <span><strong>{title}</strong>{hint ? <small>{hint}</small> : null}</span>
      <b aria-hidden="true">›</b>
    </button>
    {isOpen ? <div className="accordion-body" id={`panel-${id}`}>{children}</div> : null}
  </section>;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPortion(value: number) {
  if (value === 0) return '0';
  const eighths = Math.max(1, Math.round(value * 8));
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;
  const fractions: Record<number, string> = { 1: '八分之一', 2: '四分之一', 3: '八分之三', 4: '半', 5: '八分之五', 6: '四分之三', 7: '八分之七' };
  if (remainder === 0) return String(whole);
  if (whole === 0) return fractions[remainder];
  return remainder === 4 ? `${whole}又半` : `${whole}又${fractions[remainder]}`;
}

export default function Home() {
  const [productId, setProductId] = useState(dataset.products[0].id);
  const [sectionId, setSectionId] = useState<SectionId | null>(null);
  const [area, setArea] = useState(0.5);
  const [pressureId, setPressureId] = useState('same');
  const [historyId, setHistoryId] = useState('never');
  const [effectId, setEffectId] = useState('same');
  const [measureId, setMeasureId] = useState('cap-10');
  const [waterContainerId, setWaterContainerId] = useState('sprayer-15');

  const product = dataset.products.find((item) => item.id === productId) ?? dataset.products[0];
  const themeStyle = { '--accent': product.accent } as CSSProperties;
  const cropVisual = cropVisuals[product.id];
  const targets = targetsByProduct[product.id];
  const timing = timingByProduct[product.id];
  const operationSpray = operationSprayByProduct[product.id];
  const pressure = pressureOptions.find((item) => item.id === pressureId) ?? pressureOptions[1];
  const history = historyOptions.find((item) => item.id === historyId) ?? historyOptions[0];
  const effect = effectOptions.find((item) => item.id === effectId) ?? effectOptions[1];
  const effectAdjustment = history.id === 'never' ? 0 : effect.adjustmentMl;
  const requestedAmount = product.dosage.recommendedAmountMl + pressure.adjustmentMl + history.adjustmentMl + effectAdjustment;
  const amountPer15Liters = Math.min(product.dosage.maximumAmountMl, Math.max(product.dosage.minimumAmountMl, requestedAmount));
  const waterLiters = area * waterLitersPerMu;
  const waterJin = waterLiters * 2;
  const tankCount = waterLiters / product.dosage.tankLiters;
  const medicineMl = tankCount * amountPer15Liters;
  const waterContainer = waterContainerOptions.find((item) => item.id === waterContainerId) ?? waterContainerOptions[0];
  const waterContainerCount = waterLiters / waterContainer.capacityLiters;
  const measuringOptions = dataset.measuringContainers.filter((item) => ['cap-10', 'paper-cup-200', 'product-bottle', 'cylinder-100'].includes(item.id));
  const selectedMeasure = measuringOptions.find((item) => item.id === measureId) ?? measuringOptions[0];
  const measureCapacity = selectedMeasure.id === 'product-bottle' ? product.dosage.bottleVolumeMl : selectedMeasure.capacityMl;
  const measureCount = medicineMl / measureCapacity;
  const measureName = selectedMeasure.id === 'product-bottle' ? '本品整瓶' : selectedMeasure.name;
  const measureResult = selectedMeasure.id === 'cap-10'
    ? `约${formatDecimal(measureCount)}盖`
    : selectedMeasure.id === 'paper-cup-200'
      ? `约${formatPortion(measureCount)}杯`
      : selectedMeasure.id === 'cylinder-100'
        ? medicineMl <= 100 ? `量到${formatDecimal(medicineMl)}毫升刻度` : `共量${formatDecimal(medicineMl)}毫升`
        : `约${formatPortion(measureCount)}瓶`;

  const saveDoseImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#f7f4ea';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = product.accent;
    context.fillRect(0, 0, canvas.width, 290);
    context.fillStyle = '#fff';
    context.font = '800 58px system-ui, sans-serif';
    context.fillText(product.productName, 70, 125);
    context.font = '800 42px system-ui, sans-serif';
    context.fillText(`喷${formatDecimal(area)}亩`, 70, 220);
    context.fillStyle = '#1e241d';
    context.font = '900 68px system-ui, sans-serif';
    context.fillText(`${formatDecimal(waterJin)}斤水`, 70, 440);
    context.fillStyle = product.accent;
    context.fillText(`＋ ${measureResult}`, 70, 550);
    context.fillStyle = '#1e241d';
    context.font = '700 38px system-ui, sans-serif';
    context.fillText(product.dosage.applicationMethod, 70, 700);
    context.fillText(`本季最多${product.limits.maxUsesPerSeason}次`, 70, 810);
    if (product.limits.minimumIntervalDays) context.fillText(`两次至少间隔${product.limits.minimumIntervalDays}天`, 70, 920);
    if (product.limits.safetyIntervalDays) context.fillText(`距离收获不足${product.limits.safetyIntervalDays}天不能用`, 70, 1030);
    context.fillStyle = '#7b3f32';
    context.font = '700 27px system-ui, sans-serif';
    context.fillText('实验用虚构标签，禁止用于真实农业生产', 70, 1270);
    const link = document.createElement('a');
    link.download = `实验农药${product.code}-${formatDecimal(area)}亩用量.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <main className="app-shell" style={themeStyle}>
      <nav className="product-picker" aria-label="选择农药">
        {dataset.products.map((item) => (
          <button key={item.id} type="button" className={item.id === product.id ? 'active' : ''} aria-pressed={item.id === product.id} onClick={() => setProductId(item.id)}>
            <b>{item.code}</b><span>{item.shortName}</span>
          </button>
        ))}
      </nav>

      <header className="product-title"><h1>{product.productName}</h1></header>

      <div className="accordion" aria-label="农药标签问题">
        <AccordionItem id="suitability" title="这款药适不适合我现在的情况？" hint="查看作物、防治对象和适用时期" activeId={sectionId} onToggle={(id) => setSectionId((current) => current === id ? null : id)}>
          <section className="visual-section">
            <h3>适用作物</h3>
            <figure className="context-hero">
              <Image src={cropVisual.image} alt={cropVisual.alt} width={768} height={1024} priority />
              <figcaption><strong>{product.crop}</strong></figcaption>
            </figure>
          </section>
          <section className="visual-section">
            <h3>防治对象</h3>
            <div className={`target-gallery ${targets.length === 1 ? 'single' : ''}`}>
              {targets.map((target) => <article className="target-card" key={target.label}>
                <div className={target.damageImage ? 'target-images pair' : 'target-images'}>
                  <figure><Image src={target.image} alt={target.imageAlt} width={760} height={520} /><figcaption>{target.damageImage ? '虫子' : target.label}</figcaption></figure>
                  {target.damageImage ? <figure><Image src={target.damageImage} alt={target.damageImageAlt ?? '危害痕迹'} width={760} height={520} /><figcaption>危害痕迹</figcaption></figure> : null}
                </div>
                <h3>{target.label}</h3>
              </article>)}
            </div>
          </section>
          <section className="visual-section timing-section">
            <h3>适用时期</h3>
            {timing.parts ? <div className="timing-parts">{timing.parts.map((part) => <strong key={part}>{part}</strong>)}</div> : <strong>{timing.text}</strong>}
            {product.limits.safetyIntervalDays ? <div className="suitability-warning">距离收获不足{product.limits.safetyIntervalDays}天：不能用</div> : null}
          </section>
        </AccordionItem>

        <AccordionItem id="repeat" title="之前用过，现在还能不能再打？" hint="查看最多用多少次和隔多久可以再用" activeId={sectionId} onToggle={(id) => setSectionId((current) => current === id ? null : id)}>
          <div className="decision-strip repeat-rules">
            {product.id === 'product-a' ? <article className="only-rule"><span>本季</span><strong>只能用1次</strong></article> : <article><span>本季最多</span><strong>{product.limits.maxUsesPerSeason}次</strong></article>}
            {product.id === 'product-b' ? <article className="main-rule"><span>再次使用</span><strong>最少隔15天</strong></article> : null}
            {product.id === 'product-c' ? <article><span>再次使用</span><strong>隔7–10天</strong></article> : null}
          </div>
        </AccordionItem>

        <AccordionItem id="dose" title="我要用多少药？" hint="依据作物面积自动计算用药量" activeId={sectionId} onToggle={(id) => setSectionId((current) => current === id ? null : id)}>
          <div className="dose-result dose-result-top" aria-live="polite">
            <span>喷{formatDecimal(area)}亩</span><strong>{formatDecimal(waterJin)}斤水　＋　{measureResult}</strong>
            <div className="dose-result-visuals">
              <figure><Image src={waterContainer.image} alt={waterContainer.name} width={360} height={300} /><figcaption>{formatDecimal(waterContainerCount)}{waterContainer.unit}<small>{waterContainer.name}</small></figcaption></figure>
              <b>＋</b>
              <figure><Image src={measureImages[selectedMeasure.id]} alt={measureName} width={360} height={300} /><figcaption>{measureResult}</figcaption></figure>
            </div>
            <button type="button" className="save-dose" onClick={saveDoseImage}>保存用量图</button>
          </div>
          <div className="choice-block"><h3>喷多少亩</h3><div className="direct-choices area-choices" role="group" aria-label="喷多少亩">
            {areaOptions.map((item) => <button key={item} type="button" className={area === item ? 'selected' : ''} aria-pressed={area === item} onClick={() => setArea(item)}>{formatDecimal(item)}亩</button>)}
          </div></div>
          <div className="choice-block"><h3>{product.type === '除草剂' ? '杂草量' : product.type === '杀菌剂' ? '病斑量' : '虫量'}</h3><div className="direct-choices" role="group" aria-label="当前发生量">
            {pressureOptions.map((item) => <button key={item.id} type="button" className={pressure.id === item.id ? 'selected' : ''} aria-pressed={pressure.id === item.id} onClick={() => setPressureId(item.id)}>{item.label}</button>)}
          </div></div>
          <div className="choice-block"><h3>这款药用过多久</h3><div className="direct-choices effect-choices" role="group" aria-label="以前使用多久">
            {historyOptions.map((item) => <button key={item.id} type="button" className={history.id === item.id ? 'selected' : ''} aria-pressed={history.id === item.id} onClick={() => setHistoryId(item.id)}>{item.label}</button>)}
          </div></div>
          {history.id !== 'never' ? <div className="choice-block"><h3>上次效果</h3><div className="direct-choices" role="group" aria-label="上次使用效果">
            {effectOptions.map((item) => <button key={item.id} type="button" className={effect.id === item.id ? 'selected' : ''} aria-pressed={effect.id === item.id} onClick={() => setEffectId(item.id)}>{item.label}</button>)}
          </div></div> : null}
          <div className="choice-block"><h3>用什么量水</h3><div className="water-container-choices" role="group" aria-label="选择量水器具">
            {waterContainerOptions.map((item) => <button key={item.id} type="button" className={waterContainer.id === item.id ? 'selected' : ''} aria-pressed={waterContainer.id === item.id} onClick={() => setWaterContainerId(item.id)}>
              <Image src={item.image} alt={item.name} width={240} height={210} /><strong>{item.name}</strong>
            </button>)}
          </div></div>
          <div className="choice-block"><h3>用什么量药</h3><div className="measure-choices" role="group" aria-label="选择量药工具">
            {measuringOptions.map((item) => <button key={item.id} type="button" className={selectedMeasure.id === item.id ? 'selected' : ''} aria-pressed={selectedMeasure.id === item.id} onClick={() => setMeasureId(item.id)}>
              <Image src={measureImages[item.id]} alt={item.id === 'product-bottle' ? '本品整瓶' : item.name} width={180} height={150} /><strong>{item.id === 'product-bottle' ? '本品整瓶' : item.name}</strong>
            </button>)}
          </div></div>
        </AccordionItem>

        <AccordionItem id="operation" title="这款药打药的时候怎么操作？" hint="查看配药步骤、用药部位和特殊操作" activeId={sectionId} onToggle={(id) => setSectionId((current) => current === id ? null : id)}>
          <section className="spray-location-card">
            <h3>先看喷哪里</h3>
            <Image src={operationSpray.image} alt={operationSpray.label} width={443} height={443} />
            <strong>{operationSpray.label}</strong>
          </section>
          <h3 className="operation-title">配药步骤</h3>
          <div className="operation-flow">
            {operationSteps.map((step, index) => <article className="operation-step" key={step.label}><div><Image src={step.image} alt={step.label} width={443} height={443} /></div><strong>{index + 1}　{step.label}</strong></article>)}
          </div>
        </AccordionItem>

        <AccordionItem id="mixing" title="不能和什么药一起用？" hint="查看不能混用的药和成分" activeId={sectionId} onToggle={(id) => setSectionId((current) => current === id ? null : id)}>
          <div className="restriction-title">✕　{product.mixing.restrictedCategory}</div>
          <div className="restricted-products">
            {product.mixing.restrictedExamples.map((name) => {
              const visual = packageImages[name];
              return <article key={name}><span className="prohibited-badge" aria-hidden="true">🚫</span>{visual ? <Image src={visual.image} alt={visual.alt} width={520} height={420} /> : null}<h3>{name}</h3></article>;
            })}
          </div>
        </AccordionItem>

        <AccordionItem id="restrictions" title="在什么环境下不能用？" hint="查看天气、其他环境和作物相关限制" activeId={sectionId} onToggle={(id) => setSectionId((current) => current === id ? null : id)}>
          <div className="restriction-grid">{restrictionsByProduct[product.id].map((item) => <article key={item.label}><span aria-hidden="true">{item.symbol}</span><div><small>{item.label}</small><strong>{item.text}</strong></div></article>)}</div>
        </AccordionItem>

        <AccordionItem id="safety" title="安全防护、急救和储存信息" activeId={sectionId} onToggle={(id) => setSectionId((current) => current === id ? null : id)}>
          <div className="safety-grid">{safetyItems.map((item) => <article key={item.label}><span aria-hidden="true">{item.symbol}</span><strong>{item.label}</strong></article>)}</div>
          <div className="safety-alert">药液和清洗水不能进入河沟、池塘</div>
          <div className="general-info-grid">
            <article><h3>施药时</h3><ul><li>穿长袖防护服、长裤和胶靴，戴手套、口罩和护目镜</li><li>不饮水、不进食、不抽烟</li><li>用后洗手、洗脸、洗澡，清洗防护用品</li></ul></article>
            <article><h3>皮肤或眼睛沾到</h3><ul><li>皮肤：脱掉沾药衣物，用肥皂和清水洗净</li><li>眼睛：用大量清水冲洗15分钟</li><li>不适时带上标签就医</li></ul></article>
            <article><h3>误吸或误食</h3><ul><li>吸入：马上到空气新鲜处</li><li>误食：用清水漱口，不要自行催吐</li><li>立即带上标签就医，本品无特效解毒剂</li></ul></article>
            <article><h3>储存和废弃物</h3><ul><li>原包装密封，不要装进饮料瓶或食品容器</li><li>上锁放在阴凉、干燥、通风、避雨处，远离火源和热源</li><li>远离儿童、动物、食品、粮食、种子和饲料</li><li>包装物集中收回，不重复使用，不随意丢弃</li></ul></article>
          </div>
        </AccordionItem>
      </div>

      <footer>{dataset.disclaimer}<a href="https://commons.wikimedia.org/wiki/File:Large_crabgrass_(18835433672).jpg" target="_blank" rel="noreferrer">马唐图片：NY State IPM Program / CC BY 2.0</a></footer>
    </main>
  );
}
