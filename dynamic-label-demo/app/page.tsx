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
  pressureQuestion: string;
};
type TargetChoice = {
  label: string;
  allowed: boolean;
  image: string;
  imageAlt: string;
  imageLabel?: string;
  damageImage?: string;
  damageImageAlt?: string;
  summary: string;
  signs: string[];
  credit?: string;
  sourceUrl?: string;
};
type MedicineDetail = {
  image: string;
  imageAlt: string;
  commonPackaging: string;
  explanation: string;
};
type HelpPath = 'eligibility' | 'dose';

const areaOptions = [0.5, 1, 2, 3, 5, 10];
const waterLitersPerMu = 30;
const cropNames = ['玉米', '小麦', '水稻', '苹果树'];
const pressureOptions = [
  { id: 'same', label: '和平常差不多', adjustmentMl: 0 },
  { id: 'less', label: '比平常少', adjustmentMl: -5 },
  { id: 'more', label: '比平常多', adjustmentMl: 5 },
];

const productSurveys: Record<string, ProductSurvey> = {
  'product-a': {
    targetQuestion: '要防治的是什么草或虫？',
    growthQuestion: '玉米现在大约有几片展开叶？',
    growthOptions: [
      { id: 'three-five', label: '3–5片展开叶', allowed: true, reason: '' },
      { id: 'one-two', label: '1–2片展开叶', allowed: false, reason: '还没到标签规定的3–5叶期' },
      { id: 'six-plus', label: '6片展开叶或更多', allowed: false, reason: '已经超过标签规定的3–5叶期' },
    ],
    situationQuestion: '田里的草现在是什么情况？',
    situationOptions: [
      { id: 'small', label: '杂草大多有2–4片叶，仍比较矮小', allowed: true, reason: '' },
      { id: 'tall', label: '杂草已经长得比较大', allowed: true, reason: '' },
    ],
    pressureQuestion: '现在的杂草量和平常比怎么样？',
  },
  'product-b': {
    targetQuestion: '要防治的是什么病？',
    growthQuestion: '离小麦收获大约还有多久？',
    growthOptions: [
      { id: 'growing', label: '20天以上', allowed: true, reason: '' },
      { id: 'near-harvest', label: '不足20天', allowed: false, reason: '离收获不足20天，本产品不能用' },
    ],
    situationQuestion: '田里的病斑现在是什么情况？',
    situationOptions: [
      { id: 'early', label: '刚看到少量白色粉斑', allowed: true, reason: '' },
      { id: 'before', label: '还没见病斑，但往年容易发生', allowed: true, reason: '' },
      { id: 'joined', label: '粉斑已经扩大并连成片', allowed: true, reason: '' },
      { id: 'late', label: '叶片已经大面积发黄、早枯', allowed: true, reason: '' },
    ],
    pressureQuestion: '现在的病斑量和平常比怎么样？',
  },
  'product-c': {
    targetQuestion: '要防治的是什么虫？',
    growthQuestion: '离玉米收获大约还有多久？',
    growthOptions: [
      { id: 'growing', label: '14天以上', allowed: true, reason: '' },
      { id: 'near-harvest', label: '不足14天', allowed: false, reason: '离收获不足14天，本产品不能用' },
    ],
    situationQuestion: '田里的虫现在是什么情况？',
    situationOptions: [
      { id: 'young', label: '刚见虫卵或小幼虫，心叶有小孔', allowed: true, reason: '' },
      { id: 'boring', label: '幼虫已经大量钻进茎秆', allowed: true, reason: '' },
    ],
    pressureQuestion: '现在的虫量和平常比怎么样？',
  },
};

const targetChoicesByProduct: Record<string, TargetChoice[]> = {
  'product-a': [
    { label: '狗尾草（毛毛狗）', allowed: true, image: '/images/target-green-foxtail-real.jpg', imageAlt: '狗尾草', summary: '叶子细长，长大后会抽出毛茸茸、像狗尾巴一样的穗。', signs: ['叶片细长', '常在玉米行间成簇长出', '穗子像毛毛狗尾巴'], credit: 'Petr Filippov / Wikimedia Commons，CC BY 3.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Setaria_viridis.JPG' },
    { label: '马唐（抓地龙）', allowed: true, image: '/images/weed-crabgrass-real.jpg', imageAlt: '马唐', summary: '茎贴着地面向四周伸，节碰到土后容易扎根。', signs: ['整株向四周摊开', '茎常贴着地面', '叶片比狗尾草稍宽'] },
    { label: '牛筋草', allowed: true, image: '/images/weed-goosegrass-real.jpg', imageAlt: '牛筋草', summary: '根部扁而发白，叶子从中心向四周摊开。', signs: ['根部附近常发白', '叶片像扇子一样散开', '贴地生长、根系较牢'] },
    { label: '稗草', allowed: true, image: '/images/weed-barnyardgrass-real.jpg', imageAlt: '稗草', summary: '外形像一株小禾苗，叶片较宽，常在湿润地块成片出现。', signs: ['叶片较宽、颜色偏绿', '茎秆较直立', '成株会抽出分枝状穗'] },
    { label: '玉米螟（钻心虫）', allowed: false, image: '/images/target-asian-corn-borer-real.jpg', imageAlt: '玉米螟幼虫', imageLabel: '虫子', damageImage: '/images/target-asian-corn-borer-damage.webp', damageImageAlt: '玉米螟造成的玉米心叶小孔和虫粪', summary: '幼虫身体浅色、头部较深；受害叶片有成排小孔，心叶里有虫粪和碎屑。', signs: ['幼虫身体浅色、头部较深', '叶片上有一排小孔', '心叶里有虫粪和碎屑'], credit: '虫子：Kembangraps / Wikimedia Commons，CC BY-SA 3.0；危害痕迹：AI生成实验示意图', sourceUrl: 'https://commons.wikimedia.org/wiki/File:O_furnacalis_1.JPG' },
  ],
  'product-b': [
    { label: '小麦白粉病', allowed: true, image: '/images/target-wheat-powdery-mildew-real.jpg', imageAlt: '小麦叶片白色粉斑', summary: '麦叶表面像撒了一层白面粉，白斑会慢慢扩大。', signs: ['叶面出现白色粉斑', '粉斑逐渐连成片', '严重时叶片发黄变干'], credit: 'Agronom / Wikimedia Commons，CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Blumeria_graminis_on_winter_wheat.JPG' },
    { label: '小麦条锈病', allowed: false, image: '/images/target-wheat-stripe-rust-real.jpg', imageAlt: '小麦叶片上的条状黄色锈斑', summary: '叶片上出现一条一条的黄色或橙黄色粉点。', signs: ['黄色粉点排成长条', '用手擦可能沾上黄色粉末', '多条锈斑顺着叶片延伸'], credit: 'Yue Jin / USDA ARS，公有领域', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Stripe_rust_on_wheat.jpg' },
    { label: '小麦叶锈病', allowed: false, image: '/images/target-wheat-leaf-rust-real.jpg', imageAlt: '小麦叶片上的散生橙褐色锈点', summary: '叶片上散着许多橙黄色或褐色的小锈点。', signs: ['锈点分散排列', '颜色偏橙黄或褐色', '用手擦可能有锈色粉末'], credit: 'James Kolmer / USDA ARS，公有领域', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Wheat_leaf_rust_on_wheat.jpg' },
  ],
  'product-c': [
    { label: '玉米螟（钻心虫）', allowed: true, image: '/images/target-asian-corn-borer-real.jpg', imageAlt: '玉米螟幼虫', imageLabel: '虫子', damageImage: '/images/target-asian-corn-borer-damage.webp', damageImageAlt: '玉米螟造成的玉米心叶小孔和虫粪', summary: '幼虫身体浅色、头部较深；受害叶片有成排小孔，心叶里有虫粪和碎屑。', signs: ['幼虫身体浅色、头部较深', '嫩叶上有一排小孔', '心叶附近有虫粪或碎屑'], credit: '虫子：Kembangraps / Wikimedia Commons，CC BY-SA 3.0；危害痕迹：AI生成实验示意图', sourceUrl: 'https://commons.wikimedia.org/wiki/File:O_furnacalis_1.JPG' },
    { label: '玉米蚜虫', allowed: false, image: '/images/target-corn-aphid-real.jpg', imageAlt: '玉米叶片上的蚜虫', imageLabel: '虫子', damageImage: '/images/target-corn-aphid-damage.webp', damageImageAlt: '玉米蚜虫造成的叶片卷曲和黏液', summary: '小虫常成群聚在嫩叶或叶背；受害叶片会卷曲、发黏。', signs: ['虫体很小，常成群出现', '多聚在嫩叶或叶背', '叶片卷曲，表面发黏'], credit: '虫子：Georg Jander / Wikimedia Commons，CC BY-SA 4.0；危害痕迹：AI生成实验示意图', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Corn_leaf_aphids_(Rhopalosiphum_maidis)_on_maize_(Zea_mays).jpg' },
    { label: '草地贪夜蛾', allowed: false, image: '/images/target-fall-armyworm-insect.webp', imageAlt: '草地贪夜蛾幼虫', imageLabel: '虫子', damageImage: '/images/target-fall-armyworm-real.jpg', damageImageAlt: '草地贪夜蛾造成的玉米叶片孔洞和缺口', summary: '幼虫头部有浅色倒Y形纹，身体有纵向条纹；叶片有较大孔洞和缺口。', signs: ['头部有浅色倒Y形纹', '身体有纵向条纹', '叶片有较大孔洞，心叶里有虫粪'], credit: '虫子：AI生成实验示意图；危害痕迹：Wee Hong / Wikimedia Commons，CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Zea_mays_damaged_by_Spodoptera_frugiperda_(200218-0814).jpg' },
  ],
};

const measureImages: Record<string, string> = {
  cap: '/images/nongfu-cap-photo-cutout.png',
  'paper-cup': '/images/paper-cup-photo-cutout.png',
  'pesticide-bottle': '/images/pesticide-liquid-bottle-photo-cutout.png',
  cylinder: '/images/graduated-cylinder-photo-cutout.png',
  bottle: '/images/nongfu-water-bottle-550ml-cropped.png',
};
const mixingImages: Record<string, string> = {
  'mineral-water-5l': '/images/nongfu-water-bottle-5l-cutout.png',
  'bucket-10': '/images/container-bucket-photo-cutout.png',
  'bucket-20': '/images/container-bucket-photo-cutout.png',
  'sprayer-15': '/images/sprayer-15l-real-cropped.jpg',
  'sprayer-16': '/images/sprayer-15l-real-cropped.jpg',
};
const medicineDetails: Record<string, MedicineDetail> = {
  '辛硫磷': {
    image: '/images/phoxim-product-photo-cutout.png',
    imageAlt: '辛硫磷农药的真实瓶装包装',
    commonPackaging: '常见为深色液体，装在带旋盖的塑料农药瓶里，也有不同容量的大瓶。',
    explanation: '看包装正面的有效成分名称是否写着“辛硫磷”。只看瓶子颜色和形状认不准。',
  },
  '敌敌畏': {
    image: '/images/dichlorvos-product-photo-cutout.png',
    imageAlt: '敌敌畏农药的真实瓶装包装',
    commonPackaging: '常见为液体，使用带旋盖的塑料农药瓶包装。不同厂家的瓶形和标签颜色会不同。',
    explanation: '查看包装上的有效成分名称，写有“敌敌畏”才属于这一类。',
  },
  '含铜制剂': {
    image: '/images/copper-hydroxide-product-real.jpg',
    imageAlt: '含铜制剂的真实袋装包装',
    commonPackaging: '常见有袋装粉剂和瓶装悬浮剂。氢氧化铜、波尔多液都可能属于含铜制剂。',
    explanation: '不能只看药粉或药液是不是蓝色，要查看有效成分和类别中是否含铜。',
  },
  '生物杀菌剂': {
    image: '/images/biofungicide-product-real.png',
    imageAlt: '生物杀菌剂的真实瓶装包装',
    commonPackaging: '常见为小塑料瓶，也有袋装粉剂；包装上可能写“生物源杀菌剂”或具体微生物名称。',
    explanation: '“生物”不是单一成分，仍要查看包装上的有效成分、适用对象和混配说明。',
  },
  '波尔多液': {
    image: '/images/bordeaux-mixture-product-real.jpg',
    imageAlt: '波尔多液的真实袋装包装',
    commonPackaging: '商品常见为袋装可湿性粉剂，也可能见到瓶装悬浮剂。',
    explanation: '包装正面一般会直接写“波尔多液”；它属于含铜并呈碱性的药剂。',
  },
  '氢氧化铜制剂': {
    image: '/images/copper-hydroxide-product-real.jpg',
    imageAlt: '氢氧化铜制剂的真实袋装包装',
    commonPackaging: '常见为袋装可湿性粉剂，也有瓶装悬浮剂。',
    explanation: '查看有效成分名称是否写着“氢氧化铜”，不要只凭包装颜色判断。',
  },
  '矿物油助剂': {
    image: '/images/mineral-oil-product-real.jpg',
    imageAlt: '农业矿物油产品的真实瓶装包装',
    commonPackaging: '常见为液体，装在塑料瓶或大桶中，包装上可能写“矿物油”或清园用途。',
    explanation: '查看有效成分或产品类别是否写着“矿物油”，普通植物油或其他助剂不能只凭外观归到这一类。',
  },
  '石硫合剂': {
    image: '/images/lime-sulfur-product-real.jpg',
    imageAlt: '石硫合剂的真实瓶装包装',
    commonPackaging: '常见为棕褐色液体，装在塑料瓶或塑料桶中，也有固体粉剂包装。',
    explanation: '包装正面通常直接写“石硫合剂”；它属于碱性药剂。',
  },
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
  return formatPortion(value);
}

function formatPortion(value: number) {
  if (value === 0) return '0';
  const sign = value < 0 ? '负' : '';
  const eighths = Math.max(1, Math.round(Math.abs(value) * 8));
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;
  const fractions: Record<number, string> = { 1: '八分之一', 2: '四分之一', 3: '八分之三', 4: '半', 5: '八分之五', 6: '四分之三', 7: '八分之七' };
  if (remainder === 0) return `${sign}${whole}`;
  if (whole === 0) return `${sign}${fractions[remainder]}`;
  return `${sign}${whole}又${fractions[remainder]}`;
}

function formatCountWithUnit(value: number, unit: string) {
  const eighths = Math.max(1, Math.round(value * 8));
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;
  const fractions: Record<number, string> = { 1: '八分之一', 2: '四分之一', 3: '八分之三', 4: '半', 5: '八分之五', 6: '四分之三', 7: '八分之七' };
  if (remainder === 0) return `${whole}${unit}`;
  if (whole === 0) return `${fractions[remainder]}${unit}`;
  if (remainder === 4) return `${whole}${unit}半`;
  return `${whole}${unit}又${fractions[remainder]}${unit}`;
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
  const [pressureChoice, setPressureChoice] = useState('same');
  const [usedBefore, setUsedBefore] = useState<'yes' | 'no'>('no');
  const [lastEffect, setLastEffect] = useState('same');
  const [useCount, setUseCount] = useState(0);
  const [intervalChoice, setIntervalChoice] = useState('enough');
  const [previousMedicines, setPreviousMedicines] = useState<string[]>([]);
  const [area, setArea] = useState(1);
  const [mixingContainerId, setMixingContainerId] = useState('sprayer-15');
  const [measureId, setMeasureId] = useState('cap-10');
  const [selectedMedicineDetail, setSelectedMedicineDetail] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<'target' | 'mixing' | 'measure' | 'medicine' | null>(null);
  const [helpPath, setHelpPath] = useState<HelpPath | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(0);

  useEffect(() => {
    if (!detailModal && tutorialStep === null) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (detailModal) setDetailModal(null);
      else setTutorialStep(null);
    };
    if (detailModal) document.body.classList.add('modal-open');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [detailModal, tutorialStep]);

  useEffect(() => {
    if (tutorialStep === null) return;
    const selector = tutorialStep === 0
      ? '.product-switcher'
      : tutorialStep === 1
        ? '.path-switcher'
        : tutorialStep === 2
          ? (helpPath === 'dose' ? '.dose-card' : '.situation-card')
          : '.sticky-result';
    const frame = window.requestAnimationFrame(() => {
      document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: tutorialStep === 3 ? 'start' : 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [helpPath, tutorialStep]);

  const product = dataset.products.find((item) => item.id === productId) ?? initialProduct;
  const survey = productSurveys[product.id];
  const targetOptions = targetChoicesByProduct[product.id];
  const selectedTarget = targetOptions.find((item) => item.label === targetChoice) ?? targetOptions[0];
  const growth = survey.growthOptions.find((item) => item.id === growthChoice) ?? survey.growthOptions[0];
  const situation = survey.situationOptions.find((item) => item.id === situationChoice) ?? survey.situationOptions[0];
  const pressure = pressureOptions.find((item) => item.id === pressureChoice) ?? pressureOptions[0];
  const allMedicineOptions = medicineOptions(product);
  const previousMedicineOptions = allMedicineOptions.filter((item) => item.value !== 'none');

  const waterLiters = area * waterLitersPerMu;
  const waterJin = waterLiters * 2;
  const doseAdjustments: Array<{ label: string; amountMl: number }> = [];
  if (usedBefore === 'no') doseAdjustments.push({ label: '之前没用过这款药', amountMl: -5 });
  if (usedBefore === 'yes' && lastEffect === 'poor') doseAdjustments.push({ label: '上次效果不好', amountMl: 5 });
  if (pressure.adjustmentMl !== 0) doseAdjustments.push({ label: `${pressure.label}`, amountMl: pressure.adjustmentMl });
  const requestedAmountMl = product.dosage.recommendedAmountMl + doseAdjustments.reduce((sum, item) => sum + item.amountMl, 0);
  const amountPer15Liters = Math.min(product.dosage.maximumAmountMl, Math.max(product.dosage.minimumAmountMl, requestedAmountMl));
  const medicineMl = waterLiters / product.dosage.tankLiters * amountPer15Liters;
  const appliedAdjustmentMl = amountPer15Liters - product.dosage.recommendedAmountMl;
  const doseDirection = appliedAdjustmentMl > 0 ? '增加' : appliedAdjustmentMl < 0 ? '减少' : '保持一般用量';
  const doseReasonText = doseAdjustments.length
    ? doseAdjustments.map((item) => `${item.label}：${item.amountMl > 0 ? '加' : '减'}${Math.abs(item.amountMl)} mL`).join('；')
    : '上次效果正常，当前发生量和平常差不多';
  const doseLimitText = requestedAmountMl < product.dosage.minimumAmountMl
    ? `计算结果低于标签下限，按${formatNumber(product.dosage.minimumAmountMl)} mL使用`
    : requestedAmountMl > product.dosage.maximumAmountMl
      ? `计算结果高于标签上限，按${formatNumber(product.dosage.maximumAmountMl)} mL使用`
      : `用量在标签规定的${formatNumber(product.dosage.minimumAmountMl)}–${formatNumber(product.dosage.maximumAmountMl)} mL内`;
  const measureOrder = ['cap-10', 'paper-cup-200', 'product-bottle', 'cylinder-100', 'mineral-bottle-550'];
  const measuringOptions = dataset.measuringContainers
    .filter((item) => item.id !== 'custom-measuring' && item.id !== 'cup-50')
    .sort((left, right) => measureOrder.indexOf(left.id) - measureOrder.indexOf(right.id));
  const selectedMeasure = measuringOptions.find((item) => item.id === measureId) ?? measuringOptions[0];
  const mixingOptions = dataset.mixingContainers.filter((item) => item.kind !== 'custom');
  const selectedMixingContainer = mixingOptions.find((item) => item.id === mixingContainerId) ?? mixingOptions[0];
  const mixingContainerCount = waterLiters / selectedMixingContainer.capacityLiters;
  const mixingContainerUnit = selectedMixingContainer.kind === 'sprayer' ? '壶' : '桶';
  const mixingContainerCountText = formatCountWithUnit(mixingContainerCount, mixingContainerUnit);
  const medicinePerFullContainerMl = amountPer15Liters * selectedMixingContainer.capacityLiters / product.dosage.tankLiters;
  const mixingImage = mixingImages[selectedMixingContainer.id] ?? mixingImages['bucket-10'];
  const measureCapacity = selectedMeasure.id === 'product-bottle' ? product.dosage.bottleVolumeMl : selectedMeasure.capacityMl;
  const measureCount = medicineMl / measureCapacity;
  const fullMeasures = Math.floor(measureCount);
  const remainingMl = medicineMl - fullMeasures * measureCapacity;
  const measureName = selectedMeasure.id === 'product-bottle' ? '本品整瓶' : selectedMeasure.name;
  const measureResult = selectedMeasure.kind === 'cap'
    ? `约${formatNumber(measureCount)}盖`
    : selectedMeasure.kind === 'paper-cup'
      ? `约${formatPortion(measureCount)}杯`
      : selectedMeasure.kind === 'pesticide-bottle' || selectedMeasure.kind === 'bottle'
        ? `约${formatPortion(measureCount)}瓶`
        : medicineMl < measureCapacity
            ? `量到${formatNumber(medicineMl)}刻度`
            : remainingMl === 0 ? `装满${fullMeasures}筒` : `${fullMeasures}筒装满，另量到${formatNumber(remainingMl)}刻度`;

  const blockers: string[] = [];
  if (cropChoice !== product.crop) blockers.push(`本产品不适用于${cropChoice}`);
  if (!selectedTarget.allowed) blockers.push(`这款药不能防治${selectedTarget.label}`);
  if (!growth.allowed) blockers.push(growth.reason);
  if (useCount >= product.limits.maxUsesPerSeason) blockers.push(`本季最多使用${product.limits.maxUsesPerSeason}次`);
  if (product.limits.minimumIntervalDays && useCount > 0 && useCount < product.limits.maxUsesPerSeason && intervalChoice !== 'enough') {
    blockers.push(`距上次使用需要满${product.limits.minimumIntervalDays}天`);
  }
  const blockedMedicines = previousMedicines.filter((item) => product.mixing.restrictedExamples.includes(item));
  blockedMedicines.forEach((medicine) => blockers.push(`不能与${medicine}混配`));

  const canUse = blockers.length === 0;
  const equation = `${formatNumber(waterJin)}斤水＋${measureResult}`;
  const themeStyle = { '--accent': product.accent } as CSSProperties;
  const measureImage = measureImages[selectedMeasure.kind] ?? measureImages.cylinder;
  const eligibilitySituationText = [
    cropChoice,
    selectedTarget.label,
    growth.label,
    ...(selectedTarget.allowed ? [situation.label] : []),
    `本季已使用${useCount}次`,
  ].join('；');
  const doseSituationText = [
    pressure.label,
    usedBefore === 'yes' ? `之前用过，上次${lastEffect === 'poor' ? '效果不好' : lastEffect === 'good' ? '效果很好' : '效果一般'}` : '之前没有用过',
  ].join('；');
  const currentSituationText = helpPath === 'dose' ? doseSituationText : eligibilitySituationText;
  const dosageAndMethodText = `喷${formatNumber(area)}亩，${formatNumber(waterJin)}斤水＋${measureResult}；每15升（30斤）水用${formatNumber(amountPer15Liters)} mL；${product.dosage.applicationMethod}`;
  const usePrecautionItems = [
    '使用前充分摇匀，药液配好后尽快用完，放置不要超过12小时',
    product.id === 'product-a' ? '大风或预计1小时内下雨时不要喷' : '作物开花或蜜蜂活动时不要喷',
    `不要与${product.mixing.restrictedCategory}混用，避免污染河沟和池塘`,
  ];
  const usePrecautionText = usePrecautionItems.join('；');
  const selectedMedicineOption = selectedMedicineDetail
    ? previousMedicineOptions.find((item) => item.label === selectedMedicineDetail)
    : null;
  const selectedMedicine = selectedMedicineDetail ? medicineDetails[selectedMedicineDetail] : null;

  const chooseProduct = (nextProductId: string) => {
    const nextProduct = dataset.products.find((item) => item.id === nextProductId) ?? initialProduct;
    const nextSurvey = productSurveys[nextProduct.id];
    setProductId(nextProduct.id);
    setCropChoice(nextProduct.crop);
    setTargetChoice(targetChoicesByProduct[nextProduct.id][0].label);
    setGrowthChoice(nextSurvey.growthOptions[0].id);
    setSituationChoice(nextSurvey.situationOptions[0].id);
    setPressureChoice('same');
    setUsedBefore('no');
    setLastEffect('same');
    setUseCount(0);
    setIntervalChoice('enough');
    setPreviousMedicines([]);
    setSelectedMedicineDetail(null);
    setDetailModal(null);
  };

  const togglePreviousMedicine = (medicine: string) => {
    if (medicine === 'none') return setPreviousMedicines([]);
    setPreviousMedicines((current) => current.includes(medicine) ? current.filter((item) => item !== medicine) : [...current, medicine]);
  };

  const advanceTutorial = () => {
    if (tutorialStep === null) return;
    if (tutorialStep === 1 && !helpPath) setHelpPath('eligibility');
    if (tutorialStep >= 3) setTutorialStep(null);
    else setTutorialStep(tutorialStep + 1);
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
    context.font = '800 58px system-ui, sans-serif';
    drawWrappedText(context, product.productName, 80, 110, 920, 68);
    context.fillStyle = '#1f241d';
    context.font = '800 40px system-ui, sans-serif';
    context.fillText('用量用法', 80, 375);
    context.font = '800 64px system-ui, sans-serif';
    context.fillText(`喷 ${formatNumber(area)} 亩`, 80, 465);
    context.fillStyle = product.accent;
    context.font = '800 58px system-ui, sans-serif';
    context.fillText(`${formatNumber(waterJin)}斤水 ＋ ${measureResult}`, 80, 555);
    context.fillStyle = '#1f241d';
    context.font = '700 34px system-ui, sans-serif';
    context.fillText(`每15升（30斤）水用 ${formatNumber(amountPer15Liters)} mL`, 80, 635);
    context.font = '600 31px system-ui, sans-serif';
    const methodEndY = drawWrappedText(context, `怎么喷：${product.dosage.applicationMethod}`, 80, 705, 920, 48);
    context.strokeStyle = '#c8c2b5';
    context.lineWidth = 3;
    context.beginPath();
    const dividerY = methodEndY + 18;
    context.moveTo(80, dividerY);
    context.lineTo(1000, dividerY);
    context.stroke();
    context.font = '800 38px system-ui, sans-serif';
    context.fillText('用法注意', 80, dividerY + 75);
    context.font = '600 29px system-ui, sans-serif';
    let y = dividerY + 140;
    usePrecautionItems.forEach((note) => {
      context.fillText('•', 80, y);
      y = drawWrappedText(context, note, 120, y, 865, 45) + 12;
    });
    context.fillStyle = '#5d635a';
    context.font = '500 25px system-ui, sans-serif';
    drawWrappedText(context, `目前情况：${currentSituationText}`, 80, Math.min(y + 28, 1240), 920, 38);
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
      <section className={`sticky-result ${!helpPath ? 'waiting' : helpPath === 'dose' ? 'dose-ready' : canUse ? 'usable' : 'blocked'} ${tutorialStep === 3 ? 'tutorial-focus' : ''}`} aria-live="polite">
        <div className="use-answer">
          <small>{helpPath === 'dose' ? '自动计算结果' : '自动判断结果'}</small>
          <strong>{!helpPath ? '等待选择' : helpPath === 'dose' ? '用量结果' : canUse ? '可以用' : '不能用'}</strong>
        </div>
        <div className="top-dose">
          {!helpPath ? <strong>选择下面一个入口开始</strong> : null}
          {helpPath === 'dose' ? <strong>喷{formatNumber(area)}亩：{equation}</strong> : null}
          {helpPath === 'eligibility' && canUse ? <strong>当前选择符合标签使用条件</strong> : null}
          {helpPath === 'eligibility' && !canUse ? <>
            <strong>发现{blockers.length}个问题</strong>
            <ul className="top-problems">{blockers.map((item) => <li key={item}>{item}</li>)}</ul>
          </> : null}
          <small>{helpPath ? '调整下面的选项，结果会自动更新' : '结果会自动显示在这里'}</small>
        </div>
      </section>

      <nav className={`product-switcher ${tutorialStep === 0 ? 'tutorial-focus' : ''}`} aria-label="选择实验农药">
        <span>选择实验农药</span>
        <div>{dataset.products.map((item) => (
          <button key={item.id} type="button" className={item.id === product.id ? 'active' : ''} aria-pressed={item.id === product.id} onClick={() => chooseProduct(item.id)}>
            <b>{item.code}</b><small>{item.shortName}</small>
          </button>
        ))}</div>
      </nav>

      <section className={`path-switcher ${tutorialStep === 1 ? 'tutorial-focus' : ''}`} aria-label="选择要解决的问题">
        <button type="button" className={helpPath === 'eligibility' ? 'active' : ''} aria-pressed={helpPath === 'eligibility'} onClick={() => setHelpPath('eligibility')}>
          <strong>我不知道这款药能不能用</strong>
          <span>判断是否适合作物、对象和当前使用条件</span>
        </button>
        <button type="button" className={helpPath === 'dose' ? 'active' : ''} aria-pressed={helpPath === 'dose'} onClick={() => setHelpPath('dose')}>
          <strong>我不知道这次要用多少</strong>
          <span>直接计算每桶药量、总水量和总药量</span>
        </button>
      </section>

      <header className="product-header">
        <h1>{product.productName}</h1>
      </header>

      <section className="page-guide">
        <p><strong>使用指南：</strong>请选择与你实际使用情况相符的选项。当前默认情况可以使用；如果你的情况不同，点击对应的下拉框进行调整。</p>
        <button type="button" onClick={() => setTutorialStep(0)}>查看页面教程</button>
      </section>

      {helpPath === 'eligibility' ? <section className={`question-card situation-card ${tutorialStep === 2 ? 'tutorial-focus' : ''}`}>
        <div className="section-heading">
          <h2>判断这款药能不能用</h2>
          <p>这些问题会判断当前条件是否符合标签要求。哪里与实际情况不同，就调整哪里的选项。</p>
        </div>
        <div className="question-grid">
          <label><span>种的是什么？</span><select value={cropChoice} onChange={(event) => setCropChoice(event.target.value)}>
            {[product.crop, ...cropNames.filter((item) => item !== product.crop)].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>{cropChoice !== product.crop ? <small className="field-message error">本产品不适用于{cropChoice}</small> : null}</label>
          <label><span>{survey.targetQuestion}</span><select value={targetChoice} onChange={(event) => { setTargetChoice(event.target.value); setDetailModal('target'); }}>
            {targetOptions.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
          </select>{!selectedTarget.allowed ? <small className="field-message error">这款药不能防治{selectedTarget.label}</small> : null}</label>
          <label><span>{survey.growthQuestion}</span><select value={growthChoice} onChange={(event) => setGrowthChoice(event.target.value)}>
            {survey.growthOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>{!growth.allowed ? <small className="field-message error">{growth.reason}</small> : null}</label>
          {selectedTarget.allowed ? <label><span>{survey.situationQuestion}</span><select value={situationChoice} onChange={(event) => setSituationChoice(event.target.value)}>
            {survey.situationOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select></label> : null}
          <label><span>这一季已经用过这款药几次？</span><select value={useCount} onChange={(event) => setUseCount(Number(event.target.value))}>
            {Array.from({ length: product.limits.maxUsesPerSeason + 1 }, (_, index) => <option key={index} value={index}>{index}次</option>)}
            <option value={product.limits.maxUsesPerSeason + 1}>{product.limits.maxUsesPerSeason + 1}次或更多</option>
          </select>{useCount >= product.limits.maxUsesPerSeason ? <small className="field-message error">本季最多使用{product.limits.maxUsesPerSeason}次</small> : null}</label>
          {product.limits.minimumIntervalDays && useCount > 0 && useCount < product.limits.maxUsesPerSeason ? (
            <label><span>距上次使用这款药大约多久？</span><select value={intervalChoice} onChange={(event) => setIntervalChoice(event.target.value)}>
              <option value="enough">{product.limits.minimumIntervalDays}天以上</option><option value="one-three">1–3天</option><option value="four-six">4–6天</option>
            </select>{intervalChoice !== 'enough' ? <small className="field-message error">距上次使用需要满{product.limits.minimumIntervalDays}天</small> : null}</label>
          ) : null}
        </div>

        <fieldset className="medicine-history">
          <legend>这一茬之前还用过哪些药？（可多选）</legend>
          <label className="check-option"><input type="checkbox" checked={previousMedicines.length === 0} onChange={() => togglePreviousMedicine('none')} /><span>还没用过其他药</span></label>
          {previousMedicineOptions.map((item) => (
            <div className="medicine-option" key={item.value}>
              <label className="check-option"><input type="checkbox" checked={previousMedicines.includes(item.label)} onChange={() => togglePreviousMedicine(item.label)} /><span>{item.label}</span></label>
              <button type="button" className="medicine-detail-trigger" onClick={() => { setSelectedMedicineDetail(item.label); setDetailModal('medicine'); }}>看包装与解释</button>
            </div>
          ))}
          {blockedMedicines.length ? <div className="field-problem-list">{blockedMedicines.map((medicine) => <p key={medicine}>不能与{medicine}混配</p>)}</div> : null}
        </fieldset>

        <div className={`inline-judgment ${canUse ? 'usable' : 'blocked'}`} aria-live="polite">
          <strong>当前判断：{canUse ? '可以用' : '不能用'}</strong>
          {canUse ? <span>以上选择符合标签使用条件。</span> : <ul>{blockers.map((item) => <li key={item}>{item}</li>)}</ul>}
        </div>
      </section>

      : null}

      {helpPath === 'dose' ? <section className={`question-card dose-card ${tutorialStep === 2 ? 'tutorial-focus' : ''}`}>
        <div className="section-heading"><h2>计算这次要用多少</h2><p>选择与你本次使用情况相符的选项，页面会直接计算每桶药量、总水量和总药量。</p></div>

        <div className="dose-context">
          <label><span>{survey.pressureQuestion}</span><select value={pressureChoice} onChange={(event) => setPressureChoice(event.target.value)}>
            {pressureOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select></label>

          <fieldset className="use-experience">
            <legend>之前使用过这款药吗？</legend>
            <div className="choice-row">
              <label className="check-option"><input type="radio" name="used-before" value="no" checked={usedBefore === 'no'} onChange={() => setUsedBefore('no')} /><span>没有用过</span></label>
              <label className="check-option"><input type="radio" name="used-before" value="yes" checked={usedBefore === 'yes'} onChange={() => setUsedBefore('yes')} /><span>用过</span></label>
            </div>
            {usedBefore === 'yes' ? <div className="history-followup single">
              <label><span>上次效果怎么样？</span><select value={lastEffect} onChange={(event) => setLastEffect(event.target.value)}>
                <option value="good">效果很好</option><option value="same">效果一般</option><option value="poor">效果不好</option>
              </select></label>
            </div> : null}
          </fieldset>
        </div>

        <div className="dose-selects">
          <label><span>这次需要喷多少亩？</span><select value={area} onChange={(event) => setArea(Number(event.target.value))}>{areaOptions.map((item) => <option key={item} value={item}>{formatNumber(item)}亩</option>)}</select></label>
          <label><span>准备用什么装水？</span><select value={selectedMixingContainer.id} onChange={(event) => setMixingContainerId(event.target.value)}>
            {mixingOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <label><span>准备用什么量药？</span><select value={selectedMeasure.id} onChange={(event) => setMeasureId(event.target.value)}>
            {measuringOptions.map((item) => <option key={item.id} value={item.id}>{item.id === 'product-bottle' ? '本品整瓶' : item.name}</option>)}
          </select></label>
        </div>

        <div className="dose-adjustment" aria-live="polite">
          <strong>本次每15升（30斤）水用 {formatNumber(amountPer15Liters)} mL</strong>
          <span>一般用量{formatNumber(product.dosage.recommendedAmountMl)} mL，本次{doseDirection}{appliedAdjustmentMl === 0 ? '' : `${Math.abs(appliedAdjustmentMl)} mL`}。</span>
          <small><b>为什么这样调整：</b>{doseReasonText}；{doseLimitText}。</small>
        </div>

        <div className="dose-visual" aria-label={equation}>
          <figure><div className="visual-image water-image"><Image src={mixingImage} alt={selectedMixingContainer.name} width={220} height={220} /></div><figcaption><span className="visual-count">需要{mixingContainerCountText}</span><strong>{formatNumber(waterJin)}斤水</strong><button type="button" className="keyword-trigger" onClick={() => setDetailModal('mixing')}>{selectedMixingContainer.name}</button></figcaption></figure>
          <b className="visual-operator">＋</b>
          <figure><div className="visual-image measure-image"><Image src={measureImage} alt={measureName} width={220} height={220} /></div><figcaption><span className="visual-count">量取{measureResult}</span><strong>{measureResult}</strong><button type="button" className="keyword-trigger" onClick={() => setDetailModal('measure')}>{measureName}</button></figcaption></figure>
        </div>
        <div className="dose-equation"><strong>{formatNumber(waterJin)}斤水</strong><b>＋</b><strong>{measureResult}</strong></div>
        <p className="conversion-note">已自动换算：共{formatNumber(waterLiters)}升水（{formatNumber(waterJin)}斤），需要{mixingContainerCountText}；共需{formatNumber(medicineMl)} mL本品，用{measureName}量取就是{measureResult}。</p>
      </section> : null}

      {helpPath === 'dose' ? <section className="save-card">
        <div className="save-preview"><h2>{product.productName}</h2>
          <strong>喷{formatNumber(area)}亩：{formatNumber(waterJin)}斤水＋{measureResult}</strong>
          <ul>
            <li className="primary-detail"><strong>用量用法：</strong>{dosageAndMethodText}</li>
            <li className="use-caution"><strong>用法注意：</strong>{usePrecautionText}</li>
            <li className="situation-detail"><strong>用量依据：</strong>{currentSituationText}</li>
          </ul>
        </div>
        <button type="button" onClick={saveResultImage}>保存这张用药图</button>
      </section> : null}

      <details className="label-details"><summary>查看{product.code}款完整标签详情</summary><div className="full-label">
        <section><h3>产品身份</h3><p><strong>产品名称：</strong>{product.productName}</p><p><strong>有效成分：</strong>{product.activeIngredients.map((item) => `${item.name}${item.percentage}%`).join('；')}</p><p><strong>剂型与毒性：</strong>{product.formulation}；{product.toxicity}</p><p><strong>类别：</strong>{product.type}</p></section>
        <section><h3>适用对象与用量</h3><p><strong>作物与对象：</strong>{product.crop} · {product.target}</p><p><strong>性能：</strong>{product.fullLabel.performance}</p><p><strong>标签剂量：</strong>{product.dosage.standardLabel}</p><p><strong>怎么喷：</strong>{product.dosage.applicationMethod}</p></section>
        <section className="wide"><h3>施用提醒</h3><ul className="reminder-list"><li>使用前充分摇匀</li><li>{product.dosage.applicationMethod}</li><li>药液配好后尽快用完，放置不要超过12小时</li></ul></section>
        <section><h3>时期和使用限制</h3><ul>{product.fullLabel.technicalRequirements.map((item) => <li key={item}>{item}</li>)}</ul><p className="detail-warning">{product.limits.hardBoundary}</p></section>
        <section><h3>混配和用法禁忌</h3><p>不能与{product.mixing.restrictedCategory}混用，例如{product.mixing.restrictedExamples.join('、')}。</p><ul>{product.fullLabel.precautions.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="wide"><h3>出现问题时</h3><p><strong>{product.problemGuidance.trigger}：</strong></p><ul>{product.problemGuidance.do.map((item) => <li key={item}>{item}</li>)}</ul><ul className="dont-list">{product.problemGuidance.doNot.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="wide"><h3>注意事项</h3><ol>{generalPrecautions.map((item) => <li key={item}>{item}</li>)}</ol></section>
        <section><h3>中毒急救措施</h3><p>{firstAid}</p></section><section><h3>储存和运输方法</h3><p>{storage}</p></section>
        <section className="wide registration-details"><h3>登记和生产信息</h3><p><strong>实验虚构登记号：</strong>EXP-PD-{product.code}0823　<strong>产品标准号：</strong>LAB/FIC-{product.code}-2026　<strong>生产许可证号：</strong>EXP-XK-{product.code}0823</p><p><strong>净含量：</strong>{product.dosage.bottleVolumeMl}毫升　<strong>生产日期及批号：</strong>见封口　<strong>质量保证期：</strong>2年</p><p><strong>生产者：</strong>原野标签研究实验室（虚构机构）　<strong>电话：</strong>000-00000000（不可拨打）</p></section>
        <div className="safety-tags wide">{['穿防护服', '佩戴口罩', '戴护目镜', '佩戴手套', '施药后清洗', '远离儿童', '勿污染水体'].map((item) => <span key={item}>{item}</span>)}</div>
      </div></details>

      {tutorialStep !== null ? <>
        <div className="tutorial-shade" aria-hidden="true" />
        <section className={`tutorial-coachmark step-${tutorialStep + 1}`} role="dialog" aria-label={`页面教程，第${tutorialStep + 1}步，共4步`}>
          <span className="tutorial-step">{tutorialStep + 1} / 4</span>
          {tutorialStep === 0 ? <><strong>先选你手里的实验农药</strong><p>点击页面中高亮的 A、B 或 C，切换到对应的产品。</p></> : null}
          {tutorialStep === 1 ? <><strong>再选择你现在的问题</strong><p>“能不能用”和“要用多少”是两条独立路径，直接选择其中一个。</p></> : null}
          {tutorialStep === 2 ? <><strong>哪里与实际情况不同，就点哪里</strong><p>点击高亮区域里的下拉框，选择与你当前使用情况相符的选项。</p></> : null}
          {tutorialStep === 3 ? <><strong>最后看页面顶部的自动结果</strong><p>每次修改选项后，顶部都会立即更新；如果有多个问题，会全部列出来。</p></> : null}
          <div className="tutorial-controls">
            <button type="button" className="tutorial-skip" onClick={() => setTutorialStep(null)}>跳过教程</button>
            {tutorialStep > 0 ? <button type="button" onClick={() => setTutorialStep(tutorialStep - 1)}>上一步</button> : null}
            <button type="button" className="tutorial-next" autoFocus onClick={advanceTutorial}>{tutorialStep === 3 ? '开始使用' : '下一步'}</button>
          </div>
        </section>
      </> : null}

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
                {selectedTarget.damageImage ? <div className="target-image-pair">
                  <figure><div className="target-choice-image"><Image src={selectedTarget.image} alt={selectedTarget.imageAlt} width={900} height={620} /></div><figcaption>{selectedTarget.imageLabel ?? '虫子'}</figcaption></figure>
                  <figure><div className="target-choice-image"><Image src={selectedTarget.damageImage} alt={selectedTarget.damageImageAlt ?? '危害痕迹'} width={900} height={620} /></div><figcaption>危害痕迹</figcaption></figure>
                </div> : <div className="target-choice-image">
                  <Image src={selectedTarget.image} alt={selectedTarget.imageAlt} width={900} height={620} />
                </div>}
                <p>{selectedTarget.summary}</p>
                <ul>{selectedTarget.signs.map((item) => <li key={item}>{item}</li>)}</ul>
              </>
            ) : null}
            {detailModal === 'medicine' && selectedMedicine ? (
              <>
                <span className="modal-kicker">常见真实包装</span>
                <h2 id="detail-modal-title">{selectedMedicineDetail}</h2>
                <div className="modal-object-image medicine-package"><Image src={selectedMedicine.image} alt={selectedMedicine.imageAlt} width={900} height={700} /></div>
                <div className="modal-facts">
                  <p><strong>常见包装：</strong>{selectedMedicine.commonPackaging}</p>
                  <p><strong>怎么辨认：</strong>{selectedMedicine.explanation}</p>
                  <p><strong>与本品的关系：</strong>{selectedMedicineOption?.value.startsWith('restricted:') ? '本产品标签明确不能与它混用。' : '本产品标签没有把它列为明确禁配，但不等于可以随意混用。'}</p>
                </div>
              </>
            ) : null}
            {detailModal === 'mixing' ? (
              <>
                <span className="modal-kicker">容器关键词</span>
                <h2 id="detail-modal-title">{selectedMixingContainer.name}</h2>
                <div className="modal-object-image"><Image src={mixingImage} alt={selectedMixingContainer.name} width={720} height={420} /></div>
                <div className="modal-facts">
                  <p><strong>装满一次：</strong>{formatNumber(selectedMixingContainer.capacityLiters)}升水（{formatNumber(selectedMixingContainer.capacityLiters * 2)}斤）。</p>
                  <p><strong>本次需要：</strong>{mixingContainerCountText}，共{formatNumber(waterLiters)}升水（{formatNumber(waterJin)}斤），喷{formatNumber(area)}亩。</p>
                  <p><strong>分桶配药：</strong>每装满一次配{formatNumber(medicinePerFullContainerMl)} mL；最后不足一桶时按实际水量减少。</p>
                  <p><strong>使用前：</strong>{selectedMixingContainer.note}</p>
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
