'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import Image from 'next/image';
import dataset from '@/data/pesticides.json';

type Product = (typeof dataset.products)[number];
type EffectState = 'first' | 'effective' | 'declined';
type MixState = 'none' | 'restricted-0' | 'restricted-1' | 'other';
type InfoModal = { kind: 'target' } | { kind: 'mixing'; exampleIndex: number } | null;

const cropOptions = ['玉米', '小麦'];

function StatusIcon({ kind }: { kind: 'success' | 'warning' | 'danger' }) {
  return <span className={`status-icon ${kind}`} aria-hidden="true" />;
}

export default function Home() {
  const [productId, setProductId] = useState(dataset.products[0].id);
  const product = dataset.products.find((item) => item.id === productId) as Product;

  const [crop, setCrop] = useState(product.crop);
  const [target, setTarget] = useState(product.target);
  const [timing, setTiming] = useState(product.applicationTiming.recommended);
  const [useCount, setUseCount] = useState(0);
  const [effect, setEffect] = useState<EffectState>('first');
  const [mixState, setMixState] = useState<MixState>('none');
  const [tankLiters, setTankLiters] = useState(dataset.equipment.capacityLiters);
  const [infoModal, setInfoModal] = useState<InfoModal>(null);

  const selectProduct = (nextProduct: Product) => {
    setProductId(nextProduct.id);
    setCrop(nextProduct.crop);
    setTarget(nextProduct.target);
    setTiming(nextProduct.applicationTiming.recommended);
    setUseCount(0);
    setEffect('first');
    setMixState('none');
    setInfoModal(null);
  };

  const assessment = useMemo(() => {
    const blockingReasons: string[] = [];

    if (crop !== product.crop) {
      blockingReasons.push(`本品登记作物为${product.crop}，不适用于${crop}`);
    }
    if (target !== product.target) {
      blockingReasons.push(`本品防治对象为${product.target}，不适用于${target}`);
    }
    if (timing !== product.applicationTiming.recommended) {
      blockingReasons.push(`当前时期超出推荐范围：${product.applicationTiming.recommended}`);
    }
    if (useCount >= product.limits.maxUsesPerSeason) {
      blockingReasons.push(`本季已达到最多${product.limits.maxUsesPerSeason}次的使用上限`);
    }
    if (blockingReasons.length > 0) {
      return {
        kind: 'danger' as const,
        label: '基本条件不符合，当前不可使用',
        summary: '作物、防治对象、时期或使用次数已触发标签边界。',
        reasons: blockingReasons,
      };
    }

    return {
      kind: 'success' as const,
      label: '基本条件符合',
      summary: '当前作物、防治对象、时期和使用次数符合本品标签；还需结合下方混配结论。',
      reasons: ['可以继续查看本次个性化剂量，但不得越过剂量和频率上限'],
    };
  }, [crop, product, target, timing, useCount]);

  const isRestrictedMix = mixState === 'restricted-0' || mixState === 'restricted-1';
  const selectedRestrictedIndex = mixState === 'restricted-1' ? 1 : 0;
  const selectedRestrictedName = product.mixing.restrictedExamples[selectedRestrictedIndex];

  const mixingAssessment = useMemo(() => {
    if (isRestrictedMix) {
      return {
        kind: 'danger' as const,
        label: '禁止混配，本次方案不可使用',
        summary: `所选的${selectedRestrictedName}属于${product.mixing.restrictedCategory}。必须取消混配；这不是“需要调整后继续”，而是明确禁配。`,
      };
    }

    if (mixState === 'other') {
      return {
        kind: 'warning' as const,
        label: '混配相容性尚未确认',
        summary: '标签未列出明确禁忌不等于一定可以混用。请先核对两种产品标签或咨询专业人员。',
      };
    }

    return {
      kind: 'success' as const,
      label: '未计划混配',
      summary: '当前方案没有触发混配禁忌。',
    };
  }, [isRestrictedMix, mixState, product, selectedRestrictedName]);

  const scaledDosage = useMemo(() => {
    const scale = tankLiters / product.dosage.tankLiters;
    const maximumAmountMl = Math.floor(product.dosage.maximumAmountMl * scale);

    return {
      minimumAmountMl: Math.ceil(product.dosage.minimumAmountMl * scale),
      recommendedAmountMl: Math.round(product.dosage.recommendedAmountMl * scale),
      adjustedAmountMl: Math.min(
        Math.round(product.dosage.adjustedAmountMl * scale),
        maximumAmountMl,
      ),
      maximumAmountMl,
    };
  }, [product, tankLiters]);

  const personalizedDose = useMemo(() => {
    if (effect === 'declined') {
      const frequencyAdvice = product.limits.minimumIntervalDays
        ? `如需再次施用，至少间隔${product.limits.minimumIntervalDays}天，且本季累计不得超过${product.limits.maxUsesPerSeason}次。`
        : `本品每季仅允许使用${product.limits.maxUsesPerSeason}次，不得通过补喷增加频率。`;
      return {
        amountMl: scaledDosage.adjustedAmountMl,
        kind: 'warning' as const,
        reason: `既往效果下降：在标签范围内适当上调，但仍比所选设备的用量上限低${scaledDosage.maximumAmountMl - scaledDosage.adjustedAmountMl} mL。${frequencyAdvice}`,
      };
    }

    const reduction = effect === 'effective' ? 5 : 10;
    const baseAmountMl = Math.max(
      product.dosage.minimumAmountMl,
      product.dosage.recommendedAmountMl - reduction,
    );
    const amountMl = Math.max(
      scaledDosage.minimumAmountMl,
      Math.round(baseAmountMl * tankLiters / product.dosage.tankLiters),
    );

    return {
      amountMl,
      kind: 'success' as const,
      reason: effect === 'effective'
        ? '既往效果正常：本次可在标签范围内略低于推荐中值使用。'
        : '本季尚未使用：本次先从标签范围内较低用量开始。',
    };
  }, [effect, product, scaledDosage, tankLiters]);

  const bottleBreakdown = useMemo(() => {
    const volume = product.dosage.bottleVolumeMl;
    const fullBottles = Math.floor(personalizedDose.amountMl / volume);
    const remainderMl = personalizedDose.amountMl % volume;
    const remainderRatio = remainderMl / volume;
    const fractions = [
      { value: .25, label: '¼' },
      { value: 1 / 3, label: '⅓' },
      { value: .5, label: '½' },
      { value: 2 / 3, label: '⅔' },
      { value: .75, label: '¾' },
    ];
    const closestFraction = fractions.reduce((closest, candidate) => (
      Math.abs(candidate.value - remainderRatio) < Math.abs(closest.value - remainderRatio)
        ? candidate
        : closest
    ));
    const fractionLabel = Math.abs(closestFraction.value - remainderRatio) <= .04
      ? closestFraction.label
      : `${Math.round(remainderRatio * 100)}%`;

    return {
      fullBottles,
      remainderMl,
      fillPercent: Math.round(remainderRatio * 100),
      label: fullBottles > 0
        ? `${fullBottles}瓶${remainderMl > 0 ? `＋约${fractionLabel}瓶` : ''}`
        : `约${fractionLabel}瓶`,
    };
  }, [personalizedDose.amountMl, product.dosage.bottleVolumeMl]);

  const usesRemainingAfter = Math.max(product.limits.maxUsesPerSeason - useCount - 1, 0);
  const targetOptions = [product.target, ...product.distractorTargets];
  const useCountOptions = Array.from(
    { length: product.limits.maxUsesPerSeason + 2 },
    (_, index) => index,
  );

  const themeStyle = { '--accent': product.accent } as CSSProperties;
  const canShowDose = assessment.kind !== 'danger' && mixingAssessment.kind !== 'danger';

  return (
    <main className="app-shell" style={themeStyle}>
      <header className="topbar">
        <div>
          <div className="brand-line">
            <span className="brand-mark">田</span>
            <span className="eyebrow-text">DYNAMIC LABEL PROTOTYPE</span>
          </div>
          <h1>动态农药标签</h1>
          <p>根据当前农业情境，把完整标签转换成可执行建议</p>
        </div>
        <div className="experiment-badge">实验用虚构系统</div>
      </header>

      <nav className="product-tabs" aria-label="选择实验产品">
        {dataset.products.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === product.id ? 'product-tab active' : 'product-tab'}
            style={{ '--tab-color': item.accent } as CSSProperties}
            onClick={() => selectProduct(item)}
          >
            <span className="product-code">PRODUCT {item.code}</span>
            <strong>{item.shortName}</strong>
            <span>{item.target}</span>
          </button>
        ))}
      </nav>

      <section className="product-identity">
        <div>
          <div className="identity-kicker">当前产品 · {product.type}</div>
          <h2>{product.productName}</h2>
          <p>
            {product.activeIngredients.map((item) => `${item.name}${item.percentage}%`).join('　')}
            {'　'}剂型：{product.formulation}
          </p>
        </div>
        <div className="identity-meta">
          <span>{product.toxicity}</span>
          <span>{tankLiters} L {dataset.equipment.name}</span>
        </div>
      </section>

      <div className="workspace">
        <aside className="scenario-panel">
          <div className="section-heading">
            <span className="step-number">1</span>
            <div><h2>输入当前情境</h2><p>选择与你现在情况一致的选项</p></div>
          </div>

          <div className="form-grid">
            <label>
              <span>作物</span>
              <select value={crop} onChange={(event) => setCrop(event.target.value)}>
                {cropOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>防治对象</span>
              <select value={target} onChange={(event) => setTarget(event.target.value)}>
                {targetOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button className="target-explainer wide-field" type="button" onClick={() => setInfoModal({ kind: 'target' })}>
              <Image src={product.targetGuide.image} alt={`${product.target}识别示意`} width={1456} height={1088} />
              <span>
                <b>本品防治对象：{product.target}是什么样？</b>
                <small>{product.targetGuide.plainTitle} · 点击看图和通俗解释</small>
              </span>
            </button>
            <label className="wide-field">
              <span>当前时期</span>
              <select value={timing} onChange={(event) => setTiming(event.target.value)}>
                {product.applicationTiming.options.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="wide-field">
              <span>喷雾器容量</span>
              <select value={tankLiters} onChange={(event) => setTankLiters(Number(event.target.value))}>
                {dataset.equipment.capacityOptionsLiters.map((capacity) => (
                  <option key={capacity} value={capacity}>{capacity} L {dataset.equipment.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>本季已经使用本品</span>
              <select value={useCount} onChange={(event) => setUseCount(Number(event.target.value))}>
                {useCountOptions.map((count) => <option key={count} value={count}>{count} 次</option>)}
              </select>
            </label>
            <label>
              <span>既往使用效果</span>
              <select value={effect} onChange={(event) => setEffect(event.target.value as EffectState)}>
                <option value="first">本季尚未使用</option>
                <option value="effective">效果正常</option>
                <option value="declined">上次效果下降</option>
              </select>
            </label>
            <label className="wide-field">
              <span>是否计划混配其他药物</span>
              <select value={mixState} onChange={(event) => setMixState(event.target.value as MixState)}>
                <option value="none">不混配</option>
                {product.mixing.restrictedExamples.map((item, index) => (
                  <option key={item} value={`restricted-${index}`}>计划混配：{item}</option>
                ))}
                <option value="other">计划混配：{product.mixing.notExplicitlyRestrictedExamples[0]}</option>
              </select>
            </label>
          </div>

          <div className="input-summary">
            <span>剂量换算基准</span>
            <strong>标签15 L基准 → 当前{tankLiters} L</strong>
          </div>
        </aside>

        <section className="guidance-panel" aria-live="polite">
          <div className="section-heading">
            <span className="step-number">2</span>
            <div><h2>动态使用建议</h2><p>以下内容会随左侧情境自动变化</p></div>
          </div>

          <article className={`assessment-card ${assessment.kind}`}>
            <div className="assessment-title">
              <StatusIcon kind={assessment.kind} />
              <div><span>情境适用性判断</span><h3>{assessment.label}</h3></div>
            </div>
            <p>{assessment.summary}</p>
            <ul>{assessment.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </article>

          <article className={`mix-decision ${mixingAssessment.kind}`}>
            <div className="mix-decision-title">
              <StatusIcon kind={mixingAssessment.kind} />
              <div><span>混配结论 · 单独判断</span><h3>{mixingAssessment.label}</h3></div>
            </div>
            <p>{mixingAssessment.summary}</p>
            {isRestrictedMix && (
              <button className="mix-inline-visual" type="button" onClick={() => setInfoModal({ kind: 'mixing', exampleIndex: selectedRestrictedIndex })}>
                <Image src={product.mixing.image} alt={`${selectedRestrictedName}及同类禁配药物示意`} width={1456} height={1088} />
                <span><b>{selectedRestrictedName}</b><small>点击查看图片和通俗解释</small></span>
              </button>
            )}
          </article>

          {canShowDose && (
            <article className="dose-card">
              <div className="card-label">{tankLiters} L设备的个性化剂量</div>
              <div className="dose-reference">
                <div><span>换算后的推荐量</span><strong>{scaledDosage.recommendedAmountMl} mL</strong></div>
                <b>→</b>
                <div className="personalized"><span>本次个性化用量</span><strong>{personalizedDose.amountMl} mL</strong></div>
              </div>
              <div className={`dose-adjustment-note ${personalizedDose.kind}`}>{personalizedDose.reason}</div>
              <div className="dose-equation">
                <div><strong>{tankLiters} L</strong><span>清水</span></div>
                <b>＋</b>
                <div><strong>{personalizedDose.amountMl} mL</strong><span>本品药剂</span></div>
              </div>
              <div className="bottle-conversion">
                <div className="bottle-icons" aria-hidden="true">
                  {Array.from({ length: bottleBreakdown.fullBottles }, (_, index) => (
                    <span className="dose-bottle full" key={`full-${index}`}><i /></span>
                  ))}
                  {bottleBreakdown.remainderMl > 0 && (
                    <span className="dose-bottle"><i style={{ height: `${bottleBreakdown.fillPercent}%` }} /></span>
                  )}
                </div>
                <div>
                  <span>按每瓶{product.dosage.bottleVolumeMl} mL理解</span>
                  <strong>{bottleBreakdown.label}</strong>
                  <small>本次实际量取 {personalizedDose.amountMl} mL</small>
                </div>
              </div>
              <div className="measure-note">瓶身只帮助理解大约占多少；实际配药仍应使用带刻度量杯量取，不能直接凭目测倒药。</div>
              <p>{product.dosage.applicationMethod}</p>
              <div className="source-line">标签基准：{product.dosage.standardLabel}　｜　已按{tankLiters} L容量换算至1 mL，用量上限为{scaledDosage.maximumAmountMl} mL</div>
            </article>
          )}

          <div className="limit-grid">
            <article><span>{tankLiters} L推荐量</span><strong>{scaledDosage.recommendedAmountMl} mL</strong></article>
            <article><span>{tankLiters} L用量上限</span><strong>{scaledDosage.maximumAmountMl} mL</strong></article>
            <article><span>本季上限</span><strong>最多 {product.limits.maxUsesPerSeason} 次</strong></article>
            <article>
              <span>{product.limits.minimumIntervalDays ? '最短间隔' : '时期边界'}</span>
              <strong>{product.limits.minimumIntervalDays ? `${product.limits.minimumIntervalDays} 天` : '5叶期后禁用'}</strong>
            </article>
          </div>

          {canShowDose && (
            <div className="remaining-note">本次使用后，本季还可使用本品 <strong>{usesRemainingAfter} 次</strong>。</div>
          )}
        </section>
      </div>

      <section className="support-grid">
        <article className="support-card mixing-card">
          <div className="card-label">混配限制解释</div>
          <h3>不得与{product.mixing.restrictedCategory}混用</h3>
          <p>{product.mixing.plainExplanation}</p>
          <button className="mixing-explainer" type="button" onClick={() => setInfoModal({ kind: 'mixing', exampleIndex: selectedRestrictedIndex })}>
            <Image src={product.mixing.image} alt={`${product.mixing.restrictedCategory}禁配实例示意`} width={1456} height={1088} />
            <span><b>{product.mixing.plainTitle}</b><small>图中对应：{product.mixing.restrictedExamples.join('、')} · 点击查看解释</small></span>
          </button>
          <div className="example-row">
            {product.mixing.restrictedExamples.map((item, index) => (
              <button type="button" key={item} onClick={() => setInfoModal({ kind: 'mixing', exampleIndex: index })}>{item} · 看图解释</button>
            ))}
          </div>
          <details>
            <summary>标签中未发现明确禁忌的实例</summary>
            <p>{product.mixing.notExplicitlyRestrictedExamples.join('、')}。这不代表一定可以混用，仍需核对对应产品标签。</p>
          </details>
        </article>

        <article className="support-card problem-card">
          <div className="card-label">遇到问题怎么办</div>
          <h3>如果{product.problemGuidance.trigger}</h3>
          <ol>{product.problemGuidance.do.map((item) => <li key={item}>{item}</li>)}</ol>
          <div className="dont-list">{product.problemGuidance.doNot.map((item) => <span key={item}>不要：{item}</span>)}</div>
        </article>
      </section>

      <details className="full-label">
        <summary>查看本品完整标签摘要</summary>
        <div className="full-label-grid">
          <section><h3>产品性能</h3><p>{product.fullLabel.performance}</p></section>
          <section><h3>使用技术要求</h3><ol>{product.fullLabel.technicalRequirements.map((item) => <li key={item}>{item}</li>)}</ol></section>
          <section><h3>注意事项</h3><ol>{product.fullLabel.precautions.map((item) => <li key={item}>{item}</li>)}</ol></section>
        </div>
      </details>

      {infoModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setInfoModal(null);
        }}>
          <section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
            <button className="modal-close" type="button" aria-label="关闭解释弹窗" onClick={() => setInfoModal(null)}>×</button>
            {infoModal.kind === 'target' ? (
              <>
                <Image className="modal-image" src={product.targetGuide.image} alt={`${product.target}外观识别示意`} width={1456} height={1088} />
                <div className="modal-copy">
                  <span className="modal-kicker">防治对象 · 通俗名词解释</span>
                  <h2 id="info-modal-title">{product.target}</h2>
                  <h3>{product.targetGuide.plainTitle}</h3>
                  <p>{product.targetGuide.summary}</p>
                  <ul>{product.targetGuide.lookFor.map((item) => <li key={item}>{item}</li>)}</ul>
                  <div className="modal-caution">注意：{product.targetGuide.caution}</div>
                </div>
              </>
            ) : (
              <>
                <Image className="modal-image" src={product.mixing.image} alt={`${product.mixing.restrictedCategory}禁配实例示意`} width={1456} height={1088} />
                <div className="modal-copy">
                  <span className="modal-kicker">混配药物 · 通俗名词解释</span>
                  <h2 id="info-modal-title">{product.mixing.restrictedExamples[infoModal.exampleIndex]}</h2>
                  <h3>属于{product.mixing.restrictedCategory}</h3>
                  <p>{product.mixing.restrictedExampleDescriptions[infoModal.exampleIndex]}</p>
                  <p>{product.mixing.visualExplanation}</p>
                  <div className="modal-caution danger">混配结论：不得与本品混用，必须取消混配。</div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <footer>{dataset.disclaimer}</footer>
    </main>
  );
}
