'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import Image from 'next/image';
import dataset from '@/data/pesticides.json';

type SurveyOption = { id: string; label: string; allowed: boolean; reason: string };
type ProductSurvey = {
  targetQuestion: string;
  growthQuestion: string;
  growthOptions: SurveyOption[];
  situationQuestion: string;
  situationOptions: SurveyOption[];
};
type TargetChoice = {
  label: string;
  allowed: boolean;
  image: string;
  imageAlt: string;
  summary: string;
  signs: string[];
  caution: string;
  credit?: string;
  sourceUrl?: string;
};

const areaOptions = [0.5, 1, 2, 3, 5, 10];
const cropNames = ['玉米', '小麦', '水稻', '苹果树', '露地蔬菜'];

const productSurveys: Record<string, ProductSurvey> = {
  'product-a': {
    targetQuestion: '要防治的是什么草或虫？',
    growthQuestion: '这茬玉米种了多久了？',
    growthOptions: [
      { id: 'three-five', label: '已经长出3–5片展开叶', allowed: true, reason: '' },
      { id: 'one-two', label: '刚出苗，约1–2片展开叶', allowed: false, reason: '玉米还没有长到标签规定的3–5叶期' },
      { id: 'six-plus', label: '已经长出6片展开叶或更多', allowed: false, reason: '玉米已经超过标签规定的使用叶期' },
      { id: 'near-harvest', label: '已经接近收获', allowed: false, reason: '玉米已经不在这款药的使用时期内' },
    ],
    situationQuestion: '田里的草现在是什么情况？',
    situationOptions: [
      { id: 'small', label: '杂草大多有2–4片叶，仍比较矮小', allowed: true, reason: '' },
      { id: 'not-seen', label: '还没有看到杂草', allowed: false, reason: '还没有看到需要防治的杂草' },
      { id: 'tall', label: '杂草已经长高、成片', allowed: false, reason: '杂草已经超过标签规定的2–4叶期' },
    ],
  },
  'product-b': {
    targetQuestion: '要防治的是什么病？',
    growthQuestion: '这茬小麦种了多久了？',
    growthOptions: [
      { id: 'growing', label: '已经出苗，离收获还有20天以上', allowed: true, reason: '' },
      { id: 'not-emerged', label: '刚播种，还没有出苗', allowed: false, reason: '小麦还没有进入可进行茎叶喷雾的时期' },
      { id: 'near-harvest', label: '离收获大约10–20天', allowed: false, reason: '已经进入收获前20天的安全间隔期' },
      { id: 'harvested', label: '已经收获', allowed: false, reason: '这茬小麦已经收获' },
    ],
    situationQuestion: '田里的病斑现在是什么情况？',
    situationOptions: [
      { id: 'early', label: '刚看到少量白色粉斑', allowed: true, reason: '' },
      { id: 'before', label: '还没见病斑，但往年容易发生', allowed: true, reason: '' },
      { id: 'joined', label: '粉斑已经扩大并连成片', allowed: false, reason: '病害已经不属于发病前或发病初期' },
      { id: 'late', label: '叶片已经大面积发黄、早枯', allowed: false, reason: '病害已经发展到严重后期' },
    ],
  },
  'product-c': {
    targetQuestion: '要防治的是什么虫？',
    growthQuestion: '这茬玉米种了多久了？',
    growthOptions: [
      { id: 'growing', label: '已经出苗，离收获还有14天以上', allowed: true, reason: '' },
      { id: 'not-emerged', label: '刚播种，还没有出苗', allowed: false, reason: '玉米还没有进入可喷施心叶和受害部位的时期' },
      { id: 'near-harvest', label: '离收获大约7–14天', allowed: false, reason: '已经进入收获前14天的安全间隔期' },
      { id: 'harvested', label: '已经收获', allowed: false, reason: '这茬玉米已经收获' },
    ],
    situationQuestion: '田里的虫现在是什么情况？',
    situationOptions: [
      { id: 'young', label: '刚见卵块或低龄幼虫，心叶有小孔', allowed: true, reason: '' },
      { id: 'not-seen', label: '还没看到虫、虫粪或叶片小孔', allowed: false, reason: '还没有确认需要防治的玉米螟' },
      { id: 'boring', label: '幼虫已经大量钻进茎秆', allowed: false, reason: '幼虫已经超过标签规定的低龄期' },
    ],
  },
};

const targetChoicesByProduct: Record<string, TargetChoice[]> = {
  'product-a': [
    { label: '狗尾草（毛毛狗）', allowed: true, image: '/images/target-green-foxtail-real.jpg', imageAlt: '狗尾草', summary: '叶子细长，长大后会抽出毛茸茸、像狗尾巴一样的穗。', signs: ['叶片细长', '常在玉米行间成簇长出', '穗子像毛毛狗尾巴'], caution: '草还小时穗子没有长出来，要同时看叶片和整株形状。', credit: 'Petr Filippov / Wikimedia Commons，CC BY 3.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Setaria_viridis.JPG' },
    { label: '马唐（抓地龙）', allowed: true, image: '/images/weed-crabgrass-real.jpg', imageAlt: '马唐', summary: '茎贴着地面向四周伸，节碰到土后容易扎根。', signs: ['整株向四周摊开', '茎常贴着地面', '叶片比狗尾草稍宽'], caution: '不要只看一片叶子，最好连着根部和伸展方向一起看。' },
    { label: '牛筋草', allowed: true, image: '/images/weed-goosegrass-real.jpg', imageAlt: '牛筋草', summary: '根部扁而发白，叶子从中心向四周摊开，拔起来比较费劲。', signs: ['根部附近常发白', '叶片像扇子一样散开', '贴地生长、根系较牢'], caution: '幼苗较小时容易和马唐混在一起，要看根部是否扁白。' },
    { label: '稗草', allowed: true, image: '/images/weed-barnyardgrass-real.jpg', imageAlt: '稗草', summary: '外形像一株小禾苗，叶片较宽，常在湿润地块成片出现。', signs: ['叶片较宽、颜色偏绿', '茎秆较直立', '成株会抽出分枝状穗'], caution: '幼苗和玉米、水稻等禾苗相似，喷药前要核对整株。' },
    { label: '玉米螟（钻心虫）', allowed: false, image: '/images/target-asian-corn-borer-real.jpg', imageAlt: '玉米螟低龄幼虫', summary: '幼虫先咬食心叶，之后会钻进茎秆，属于虫害而不是杂草。', signs: ['心叶上有一排小孔', '心叶里有虫粪和碎屑', '幼虫会向茎秆里钻'], caution: '这款除草剂不能用来防治玉米螟。' },
  ],
  'product-b': [
    { label: '小麦白粉病', allowed: true, image: '/images/target-wheat-powdery-mildew-real.jpg', imageAlt: '小麦叶片白色粉斑', summary: '麦叶表面像撒了一层白面粉，白斑会慢慢扩大。', signs: ['叶面出现白色粉斑', '粉斑逐渐连成片', '严重时叶片发黄变干'], caution: '灰尘和药液残留也可能发白，要看白斑是否继续扩大。', credit: 'Agronom / Wikimedia Commons，CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Blumeria_graminis_on_winter_wheat.JPG' },
    { label: '小麦条锈病', allowed: false, image: '/images/target-wheat-stripe-rust-real.jpg', imageAlt: '小麦叶片上的条状黄色锈斑', summary: '叶片上出现一条一条的黄色或橙黄色粉点。', signs: ['黄色粉点排成长条', '用手擦可能沾上黄色粉末', '多条锈斑顺着叶片延伸'], caution: '这款药只用于白粉病，看到条状黄锈斑时不要按白粉病处理。', credit: 'Yue Jin / USDA ARS，公有领域', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Stripe_rust_on_wheat.jpg' },
    { label: '小麦叶锈病', allowed: false, image: '/images/target-wheat-leaf-rust-real.jpg', imageAlt: '小麦叶片上的散生橙褐色锈点', summary: '叶片上散着许多橙黄色或褐色的小锈点，不会整齐排成长条。', signs: ['锈点分散排列', '颜色偏橙黄或褐色', '用手擦可能有锈色粉末'], caution: '叶锈病和条锈病颜色相近，重点看锈点是散开还是排成长条。', credit: 'James Kolmer / USDA ARS，公有领域', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Wheat_leaf_rust_on_wheat.jpg' },
  ],
  'product-c': [
    { label: '玉米螟（钻心虫）', allowed: true, image: '/images/target-asian-corn-borer-real.jpg', imageAlt: '玉米螟低龄幼虫', summary: '幼虫较小时先在心叶附近取食，长大后会钻进茎秆。', signs: ['嫩叶上有一排小孔', '心叶附近有虫粪或碎屑', '幼虫身体浅色、头部较深'], caution: '已经钻进茎秆的虫不容易看到，也不适合再自行加浓喷药。' },
    { label: '玉米蚜虫', allowed: false, image: '/images/target-corn-aphid-real.jpg', imageAlt: '玉米叶片上的蚜虫', summary: '许多小虫聚在嫩叶、叶背或心叶处吸食汁液。', signs: ['虫体很小，常成群出现', '多聚在嫩叶或叶背', '虫多时叶面可能发黏'], caution: '这款药只用于玉米螟，玉米蚜虫不能按钻心虫处理。', credit: 'Georg Jander / Wikimedia Commons，CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Corn_leaf_aphids_(Rhopalosiphum_maidis)_on_maize_(Zea_mays).jpg' },
    { label: '草地贪夜蛾', allowed: false, image: '/images/target-fall-armyworm-real.jpg', imageAlt: '草地贪夜蛾造成的玉米叶片破损', summary: '幼虫会把叶片咬出较大的不规则孔洞，心叶里常有较多虫粪。', signs: ['叶片缺口和孔洞较大', '心叶里有较多碎屑和虫粪', '受害严重时叶片像被撕破'], caution: '叶片破损外观会和其他虫害重叠，不能只凭一个孔洞判断。', credit: 'Wee Hong / Wikimedia Commons，CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Zea_mays_damaged_by_Spodoptera_frugiperda_(200218-0814).jpg' },
  ],
};

const measureImages: Record<string, string> = {
  cap: '/images/nongfu-cap-photo-cutout.png',
  'paper-cup': '/images/paper-cup-photo-cutout.png',
  'pesticide-bottle': '/images/pesticide-liquid-bottle-photo-cutout.png',
  cylinder: '/images/graduated-cylinder-photo-cutout.png',
  cup: '/images/container-bucket-photo-cutout.png',
  bottle: '/images/nongfu-water-bottle-550ml-cropped.png',
};

const generalPrecautions = [
  '配药和施药时穿长袖防护服、长裤和胶靴，佩戴防护手套、口罩和护目镜。',
  '施药期间不得饮水、进食或吸烟；施药后及时清洗身体、防护用具和工作服。',
  '药液、清洗液和废弃包装不得污染水域和土壤，禁止在水体中清洗施药器具。',
  '未用完的制剂放回原包装密封保存，不得转装入饮料或食品容器。',
  '使用过的包装妥善收集，不得重复使用、改作其他用途或随意丢弃。',
  '儿童、孕妇及哺乳期妇女不得接触本品。',
];
const firstAid = '使用中或使用后如感觉不适，应立即停止工作并携带本标签就医。皮肤接触用大量清水和肥皂冲洗；眼睛溅入用流动清水冲洗至少15分钟；吸入时转移到空气流通处；误食时立即漱口，不得自行引吐。无专用解毒剂，对症治疗。';
const storage = '加锁存放于阴凉、干燥、通风、防雨处，远离火源和热源。置于儿童、无关人员及动物接触不到之处，不得与食品、饮料、粮食、种子和饲料混合储运。运输时防止日晒、雨淋、倾倒和包装破损。';

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPortion(value: number) {
  const eighths = Math.max(1, Math.round(value * 8));
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;
  const fractions: Record<number, string> = { 1: '八分之一', 2: '四分之一', 3: '八分之三', 4: '半', 5: '八分之五', 6: '四分之三', 7: '八分之七' };
  if (remainder === 0) return String(whole);
  if (whole === 0) return fractions[remainder];
  return `${whole}又${fractions[remainder]}`;
}

function medicineOptions(product: (typeof dataset.products)[number]) {
  const options: Array<{ value: string; label: string }> = [{ value: 'none', label: '只用这款药' }];
  const other = product.mixing.notExplicitlyRestrictedExamples;
  const restricted = product.mixing.restrictedExamples;
  for (let index = 0; index < Math.max(other.length, restricted.length); index += 1) {
    if (other[index]) options.push({ value: `other:${other[index]}`, label: other[index] });
    if (restricted[index]) options.push({ value: `restricted:${restricted[index]}`, label: restricted[index] });
  }
  return options;
}

function drawWrappedText(context: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = '';
  let currentY = y;
  for (const character of value) {
    const nextLine = line + character;
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = character;
      currentY += lineHeight;
    } else line = nextLine;
  }
  if (line) context.fillText(line, x, currentY);
  return currentY + lineHeight;
}

export default function Home() {
  const initialProduct = dataset.products[0];
  const initialSurvey = productSurveys[initialProduct.id];
  const initialTargets = targetChoicesByProduct[initialProduct.id];
  const [productId, setProductId] = useState(initialProduct.id);
  const [cropChoice, setCropChoice] = useState(initialProduct.crop);
  const [targetChoice, setTargetChoice] = useState(initialTargets[0].label);
  const [growthChoice, setGrowthChoice] = useState(initialSurvey.growthOptions[0].id);
  const [situationChoice, setSituationChoice] = useState(initialSurvey.situationOptions[0].id);
  const [useCount, setUseCount] = useState(0);
  const [intervalChoice, setIntervalChoice] = useState('enough');
  const [previousMedicines, setPreviousMedicines] = useState<string[]>([]);
  const [area, setArea] = useState(1);
  const [measureId, setMeasureId] = useState('cap-10');
  const [detailModal, setDetailModal] = useState<'target' | 'sprayer' | 'measure' | null>(null);

  useEffect(() => {
    if (!detailModal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetailModal(null);
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [detailModal]);

  const product = dataset.products.find((item) => item.id === productId) ?? initialProduct;
  const survey = productSurveys[product.id];
  const targetOptions = targetChoicesByProduct[product.id];
  const selectedTarget = targetOptions.find((item) => item.label === targetChoice) ?? targetOptions[0];
  const growth = survey.growthOptions.find((item) => item.id === growthChoice) ?? survey.growthOptions[0];
  const situation = survey.situationOptions.find((item) => item.id === situationChoice) ?? survey.situationOptions[0];
  const allMedicineOptions = medicineOptions(product);
  const previousMedicineOptions = allMedicineOptions.filter((item) => item.value !== 'none');

  const waterLiters = area * product.dosage.tankLiters;
  const waterJin = waterLiters * 2;
  const medicineMl = area * product.dosage.recommendedAmountMl;
  const measureOrder = ['cap-10', 'paper-cup-200', 'product-bottle', 'cup-50', 'cylinder-100', 'mineral-bottle-550'];
  const measuringOptions = dataset.measuringContainers
    .filter((item) => item.id !== 'custom-measuring')
    .sort((left, right) => measureOrder.indexOf(left.id) - measureOrder.indexOf(right.id));
  const selectedMeasure = measuringOptions.find((item) => item.id === measureId) ?? measuringOptions[0];
  const measureCapacity = selectedMeasure.id === 'product-bottle' ? product.dosage.bottleVolumeMl : selectedMeasure.capacityMl;
  const measureCount = medicineMl / measureCapacity;
  const fullMeasures = Math.floor(measureCount);
  const remainingMl = medicineMl - fullMeasures * measureCapacity;
  const visualMeasureCount = selectedMeasure.kind === 'cap' ? measureCount : Math.ceil(measureCount);
  const measureName = selectedMeasure.id === 'product-bottle' ? '本品整瓶' : selectedMeasure.name;
  const measureResult = selectedMeasure.kind === 'cap'
    ? `约${formatNumber(measureCount)}盖`
    : selectedMeasure.kind === 'paper-cup'
      ? `约${formatPortion(measureCount)}杯`
      : selectedMeasure.kind === 'pesticide-bottle' || selectedMeasure.kind === 'bottle'
        ? `约${formatPortion(measureCount)}瓶`
        : selectedMeasure.kind === 'cup'
          ? `约${formatPortion(measureCount)}杯`
          : medicineMl < measureCapacity
            ? `量到${formatNumber(medicineMl)}刻度`
            : remainingMl === 0 ? `装满${fullMeasures}筒` : `${fullMeasures}筒装满，另量到${formatNumber(remainingMl)}刻度`;

  const blockers: string[] = [];
  if (cropChoice !== product.crop) blockers.push(`这款药登记用于${product.crop}，你选择的是${cropChoice}`);
  if (!selectedTarget.allowed) blockers.push(`这款药不能防治${selectedTarget.label}`);
  if (!growth.allowed) blockers.push(growth.reason);
  if (!situation.allowed) blockers.push(situation.reason);
  if (useCount >= product.limits.maxUsesPerSeason) blockers.push(`本季最多使用${product.limits.maxUsesPerSeason}次`);
  if (product.limits.minimumIntervalDays && useCount > 0 && useCount < product.limits.maxUsesPerSeason && intervalChoice !== 'enough') {
    blockers.push(`距上次使用需要满${product.limits.minimumIntervalDays}天`);
  }
  const blockedMedicine = previousMedicines.find((item) => product.mixing.restrictedExamples.some((medicine) => medicine === item));
  if (blockedMedicine) blockers.push(`不能与${blockedMedicine}混配`);

  const canUse = blockers.length === 0;
  const equation = `${formatNumber(waterJin)}斤水＋${measureResult}`;
  const themeStyle = { '--accent': product.accent } as CSSProperties;
  const measureImage = measureImages[selectedMeasure.kind] ?? measureImages.cup;
  const previousMedicineText = previousMedicines.length ? previousMedicines.join('、') : '还没用过其他药';

  const chooseProduct = (nextProductId: string) => {
    const nextProduct = dataset.products.find((item) => item.id === nextProductId) ?? initialProduct;
    const nextSurvey = productSurveys[nextProduct.id];
    setProductId(nextProduct.id);
    setCropChoice(nextProduct.crop);
    setTargetChoice(targetChoicesByProduct[nextProduct.id][0].label);
    setGrowthChoice(nextSurvey.growthOptions[0].id);
    setSituationChoice(nextSurvey.situationOptions[0].id);
    setUseCount(0);
    setIntervalChoice('enough');
    setPreviousMedicines([]);
    setDetailModal(null);
  };

  const togglePreviousMedicine = (medicine: string) => {
    if (medicine === 'none') return setPreviousMedicines([]);
    setPreviousMedicines((current) => current.includes(medicine) ? current.filter((item) => item !== medicine) : [...current, medicine]);
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
    context.fillStyle = '#fff';
    context.font = '700 38px system-ui, sans-serif';
    context.fillText(`实验农药 ${product.code} · ${product.shortName}`, 80, 82);
    context.font = '800 58px system-ui, sans-serif';
    drawWrappedText(context, product.productName, 80, 165, 920, 68);
    context.fillStyle = '#1f241d';
    context.font = '800 60px system-ui, sans-serif';
    context.fillText(`喷 ${formatNumber(area)} 亩`, 80, 400);
    context.fillStyle = product.accent;
    context.font = '800 54px system-ui, sans-serif';
    context.fillText(`${formatNumber(waterJin)}斤水 ＋ ${measureResult}`, 80, 490);
    context.fillStyle = '#1f241d';
    context.font = '700 39px system-ui, sans-serif';
    drawWrappedText(context, `用${measureName}：${measureResult}`, 80, 575, 920, 58);
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
      `${product.crop}·${selectedTarget.label}：${product.applicationTiming.recommended}`,
      `用${measureName}量：${measureResult}，${product.dosage.applicationMethod}`,
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
        <div className="use-answer"><span>根据当前选择</span><strong>{canUse ? '可以用' : '先不要用'}</strong></div>
        {canUse ? (
          <div className="top-dose"><span>实验农药 {product.code} · 喷 {formatNumber(area)} 亩</span><strong>{equation}</strong></div>
        ) : (
          <div className="top-dose"><span>先核对下面的信息</span><strong>{blockers[0]}</strong></div>
        )}
      </section>

      <nav className="product-switcher" aria-label="选择实验农药">
        <span>选择实验农药</span>
        <div>{dataset.products.map((item) => (
          <button key={item.id} type="button" className={item.id === product.id ? 'active' : ''} aria-pressed={item.id === product.id} onClick={() => chooseProduct(item.id)}>
            <b>{item.code}</b><small>{item.shortName}</small>
          </button>
        ))}</div>
      </nav>

      <header className="product-header">
        <div><span>PRODUCT {product.code} · {product.crop} · {selectedTarget.label}</span><h1>{product.productName}</h1></div>
        <strong>本季最多{product.limits.maxUsesPerSeason}次</strong>
      </header>

      <section className="question-card situation-card">
        <div className="section-heading"><span>第一步</span><h2>看看这次能不能用</h2></div>
        <div className="question-grid">
          <label><span>种的是什么？</span><select value={cropChoice} onChange={(event) => setCropChoice(event.target.value)}>
            {[product.crop, ...cropNames.filter((item) => item !== product.crop)].map((item) => <option key={item} value={item}>{item}</option>)}
          </select></label>
          <label><span>{survey.targetQuestion}</span><select value={targetChoice} onChange={(event) => { setTargetChoice(event.target.value); setDetailModal('target'); }}>
            {targetOptions.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
          </select></label>
          <label><span>{survey.growthQuestion}</span><select value={growthChoice} onChange={(event) => setGrowthChoice(event.target.value)}>
            {survey.growthOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select></label>
          {selectedTarget.allowed ? <label><span>{survey.situationQuestion}</span><select value={situationChoice} onChange={(event) => setSituationChoice(event.target.value)}>
            {survey.situationOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select></label> : null}
          <label><span>这一季已经用过这款药几次？</span><select value={useCount} onChange={(event) => setUseCount(Number(event.target.value))}>
            {Array.from({ length: product.limits.maxUsesPerSeason + 1 }, (_, index) => <option key={index} value={index}>{index}次</option>)}
            <option value={product.limits.maxUsesPerSeason + 1}>{product.limits.maxUsesPerSeason + 1}次或更多</option>
          </select></label>
          {product.limits.minimumIntervalDays && useCount > 0 && useCount < product.limits.maxUsesPerSeason ? (
            <label><span>距上次使用这款药大约多久？</span><select value={intervalChoice} onChange={(event) => setIntervalChoice(event.target.value)}>
              <option value="enough">{product.limits.minimumIntervalDays}天以上</option><option value="one-three">1–3天</option><option value="four-six">4–6天</option>
            </select></label>
          ) : null}
        </div>

        <div className="keyword-row">
          <span>选择后会自动打开图片，也可点击关键词重看：</span>
          <button type="button" className="keyword-trigger" onClick={() => setDetailModal('target')}>{selectedTarget.label}</button>
        </div>

        <fieldset className="medicine-history">
          <legend>这一茬之前还用过哪些药？（可多选，用于混配判断）</legend>
          <label className="check-option"><input type="checkbox" checked={previousMedicines.length === 0} onChange={() => togglePreviousMedicine('none')} /><span>还没用过其他药</span></label>
          {previousMedicineOptions.map((item) => (
            <label className="check-option" key={item.value}><input type="checkbox" checked={previousMedicines.includes(item.label)} onChange={() => togglePreviousMedicine(item.label)} /><span>{item.label}</span></label>
          ))}
        </fieldset>
      </section>

      <section className="question-card dose-card">
        <div className="section-heading"><span>第二步</span><h2>算这次需要多少水和药</h2></div>
        <p className="label-dose">每亩按一桶15升喷雾器的水量换算；药量优先显示为几盖、几杯或几瓶。</p>
        <div className="dose-selects">
          <label><span>这次需要喷多少亩？</span><select value={area} onChange={(event) => setArea(Number(event.target.value))}>{areaOptions.map((item) => <option key={item} value={item}>{item}亩</option>)}</select></label>
          <label><span>准备用什么量药？</span><select value={selectedMeasure.id} onChange={(event) => setMeasureId(event.target.value)}>
            {measuringOptions.map((item) => <option key={item.id} value={item.id}>{item.id === 'product-bottle' ? '本品整瓶' : item.name}</option>)}
          </select></label>
        </div>

        <div className="dose-visual" aria-label={equation}>
          <figure><div className="visual-image water-image"><Image src="/images/sprayer-15l-real-cropped.jpg" alt="15升背负式喷雾器" width={220} height={220} /><b>× {formatNumber(area)}</b></div><figcaption><strong>{formatNumber(waterJin)}斤水</strong><button type="button" className="keyword-trigger" onClick={() => setDetailModal('sprayer')}>15升喷雾器</button><span>点击关键词查看容量说明</span></figcaption></figure>
          <b className="visual-operator">＋</b>
          <figure><div className="visual-image measure-image"><Image src={measureImage} alt={measureName} width={220} height={220} /><b>× {formatNumber(visualMeasureCount)}</b></div><figcaption><strong>{measureResult}</strong><button type="button" className="keyword-trigger" onClick={() => setDetailModal('measure')}>{measureName}</button><span>点击关键词查看怎么量</span></figcaption></figure>
        </div>
        <div className="dose-equation"><strong>{formatNumber(waterJin)}斤水</strong><b>＋</b><strong>{measureResult}</strong></div>
      </section>

      <section className="save-card">
        <div className="save-preview"><span>实验农药 {product.code} · {product.shortName}</span><h2>{product.productName}</h2>
          {canUse ? <strong>喷{formatNumber(area)}亩：{formatNumber(waterJin)}斤水＋{measureResult}</strong> : <strong className="stop">当前选择需要先核对，暂不配药</strong>}
          <ul><li>{product.applicationTiming.recommended}</li><li>{product.dosage.applicationMethod}</li><li>本季最多{product.limits.maxUsesPerSeason}次{product.limits.minimumIntervalDays ? `，至少间隔${product.limits.minimumIntervalDays}天` : ''}</li><li>之前用药：{previousMedicineText}</li><li>{product.fullLabel.precautions[0]}</li></ul>
        </div>
        <button type="button" onClick={saveResultImage} disabled={!canUse}>保存这张用药图</button>
      </section>

      <details className="label-details"><summary>查看{product.code}款完整标签详情</summary><div className="full-label">
        <section><h3>产品身份</h3><p><strong>产品名称：</strong>{product.productName}</p><p><strong>有效成分：</strong>{product.activeIngredients.map((item) => `${item.name}${item.percentage}%`).join('；')}</p><p><strong>剂型与毒性：</strong>{product.formulation}；{product.toxicity}</p><p><strong>类别：</strong>{product.type}</p></section>
        <section><h3>适用对象与用量</h3><p><strong>作物与对象：</strong>{product.crop} · {product.target}</p><p><strong>性能：</strong>{product.fullLabel.performance}</p><p><strong>标签剂量：</strong>{product.dosage.standardLabel}</p><p><strong>怎么喷：</strong>{product.dosage.applicationMethod}</p></section>
        <section className="wide"><h3>施用提醒</h3><ul className="reminder-list"><li>使用前充分摇匀</li><li>{product.dosage.applicationMethod}</li><li>当天配、当天用完</li></ul></section>
        <section><h3>时期和使用限制</h3><ul>{product.fullLabel.technicalRequirements.map((item) => <li key={item}>{item}</li>)}</ul><p className="detail-warning">{product.limits.hardBoundary}</p></section>
        <section><h3>混配和用法禁忌</h3><p>不能与{product.mixing.restrictedCategory}混用，例如{product.mixing.restrictedExamples.join('、')}。</p><ul>{product.fullLabel.precautions.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="wide"><h3>出现问题时</h3><p><strong>{product.problemGuidance.trigger}：</strong></p><ul>{product.problemGuidance.do.map((item) => <li key={item}>{item}</li>)}</ul><ul className="dont-list">{product.problemGuidance.doNot.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="wide"><h3>注意事项</h3><ol>{generalPrecautions.map((item) => <li key={item}>{item}</li>)}</ol></section>
        <section><h3>中毒急救措施</h3><p>{firstAid}</p></section><section><h3>储存和运输方法</h3><p>{storage}</p></section>
        <section className="wide registration-details"><h3>登记和生产信息</h3><p><strong>实验虚构登记号：</strong>EXP-PD-{product.code}0823　<strong>产品标准号：</strong>LAB/FIC-{product.code}-2026　<strong>生产许可证号：</strong>EXP-XK-{product.code}0823</p><p><strong>净含量：</strong>{product.dosage.bottleVolumeMl}毫升　<strong>生产日期及批号：</strong>见封口　<strong>质量保证期：</strong>2年</p><p><strong>生产者：</strong>原野标签研究实验室（虚构机构）　<strong>电话：</strong>000-00000000（不可拨打）</p></section>
        <div className="safety-tags wide">{['穿防护服', '佩戴口罩', '戴护目镜', '佩戴手套', '施药后清洗', '远离儿童', '勿污染水体'].map((item) => <span key={item}>{item}</span>)}</div>
      </div></details>

      {detailModal ? (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailModal(null);
        }}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
            <button type="button" className="modal-close" aria-label="关闭详情" onClick={() => setDetailModal(null)}>×</button>
            {detailModal === 'target' ? (
              <>
                <span className="modal-kicker">识别关键词</span>
                <h2 id="detail-modal-title">{selectedTarget.label}</h2>
                <div className="target-choice-image">
                  <Image src={selectedTarget.image} alt={selectedTarget.imageAlt} width={900} height={620} />
                </div>
                <p>{selectedTarget.summary}</p>
                <ul>{selectedTarget.signs.map((item) => <li key={item}>{item}</li>)}</ul>
                <p className="modal-caution">{selectedTarget.caution}</p>
                {selectedTarget.credit ? <p className="image-credit">图片：{selectedTarget.credit}{selectedTarget.sourceUrl ? <> · <a href={selectedTarget.sourceUrl} target="_blank" rel="noreferrer">查看来源</a></> : null}</p> : null}
              </>
            ) : null}
            {detailModal === 'sprayer' ? (
              <>
                <span className="modal-kicker">容器关键词</span>
                <h2 id="detail-modal-title">15升喷雾器</h2>
                <div className="modal-object-image"><Image src="/images/sprayer-15l-real-cropped.jpg" alt="15升背负式喷雾器实物" width={720} height={420} /></div>
                <div className="modal-facts">
                  <p><strong>装满一次：</strong>15升水，也就是约30斤水。</p>
                  <p><strong>本次需要：</strong>{formatNumber(area)}桶，共{formatNumber(waterLiters)}升水，喷{formatNumber(area)}亩。</p>
                  <p><strong>使用前：</strong>以喷雾器铭牌容量为准；不是15升的喷雾器不能直接照搬桶数。</p>
                </div>
              </>
            ) : null}
            {detailModal === 'measure' ? (
              <>
                <span className="modal-kicker">量具关键词</span>
                <h2 id="detail-modal-title">{measureName}</h2>
                <div className="modal-object-image measure"><Image src={measureImage} alt={measureName} width={520} height={420} /></div>
                <div className="modal-facts">
                  <p><strong>本次药量：</strong>{formatNumber(medicineMl)} mL。</p>
                  <p><strong>怎么量：</strong>{measureResult}。</p>
                  <p><strong>怎么看：</strong>{selectedMeasure.accuracy}。</p>
                  <p><strong>注意：</strong>{selectedMeasure.note}</p>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      <footer>{dataset.disclaimer}</footer>
    </main>
  );
}
