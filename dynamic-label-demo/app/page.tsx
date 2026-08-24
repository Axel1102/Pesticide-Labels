'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import dataset from '@/data/pesticides.json';

type Product = (typeof dataset.products)[number];
type EffectState = 'first' | 'effective' | 'declined';
type MixState = 'none' | 'restricted' | 'other';

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

  const selectProduct = (nextProduct: Product) => {
    setProductId(nextProduct.id);
    setCrop(nextProduct.crop);
    setTarget(nextProduct.target);
    setTiming(nextProduct.applicationTiming.recommended);
    setUseCount(0);
    setEffect('first');
    setMixState('none');
  };

  const assessment = useMemo(() => {
    const blockingReasons: string[] = [];
    const warnings: string[] = [];

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
    if (mixState === 'restricted') {
      warnings.push(`计划混配药物属于${product.mixing.restrictedCategory}，必须取消混配`);
    }
    if (effect === 'declined') {
      warnings.push('既往效果下降，不应通过自行加浓来处理');
    }

    if (blockingReasons.length > 0) {
      return {
        kind: 'danger' as const,
        label: '当前不应该使用',
        summary: '当前情境已触发标签边界。请停止本次使用，并根据下方原因调整。',
        reasons: blockingReasons,
        warnings,
      };
    }

    if (warnings.length > 0) {
      return {
        kind: 'warning' as const,
        label: '可以使用，但需要调整或注意',
        summary: '作物、对象和时期符合，但当前计划中有需要先处理的问题。',
        reasons: warnings,
        warnings: [],
      };
    }

    return {
      kind: 'success' as const,
      label: '可以使用',
      summary: '当前作物、防治对象、时期和使用次数均符合本品标签。',
      reasons: ['按照标签剂量和施用方式操作，不要自行增加浓度'],
      warnings: [],
    };
  }, [crop, effect, mixState, product, target, timing, useCount]);

  const usesRemainingAfter = Math.max(product.limits.maxUsesPerSeason - useCount - 1, 0);
  const targetOptions = [product.target, ...product.distractorTargets];
  const useCountOptions = Array.from(
    { length: product.limits.maxUsesPerSeason + 2 },
    (_, index) => index,
  );

  const themeStyle = { '--accent': product.accent } as CSSProperties;

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
          <span>15 L 背负式喷雾器</span>
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
            <label className="wide-field">
              <span>当前时期</span>
              <select value={timing} onChange={(event) => setTiming(event.target.value)}>
                {product.applicationTiming.options.map((item) => <option key={item}>{item}</option>)}
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
                <option value="restricted">计划混配：{product.mixing.restrictedExamples[0]}</option>
                <option value="other">计划混配：{product.mixing.notExplicitlyRestrictedExamples[0]}</option>
              </select>
            </label>
          </div>

          <div className="input-summary">
            <span>当前设备</span>
            <strong>{dataset.equipment.capacityLiters} L {dataset.equipment.name}</strong>
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
            {assessment.warnings.map((warning) => <div className="sub-warning" key={warning}>{warning}</div>)}
          </article>

          {assessment.kind !== 'danger' && (
            <article className="dose-card">
              <div className="card-label">本次15 L实际用量</div>
              <div className="dose-equation">
                <div><strong>{product.dosage.tankLiters} L</strong><span>清水</span></div>
                <b>＋</b>
                <div><strong>{product.dosage.amountMl} mL</strong><span>本品药剂</span></div>
              </div>
              <p>{product.dosage.applicationMethod}</p>
              <div className="source-line">原标签：{product.dosage.standardLabel}</div>
            </article>
          )}

          <div className="limit-grid">
            <article><span>剂量上限</span><strong>{product.dosage.amountMl} mL / 15 L</strong></article>
            <article><span>本季上限</span><strong>最多 {product.limits.maxUsesPerSeason} 次</strong></article>
            <article>
              <span>{product.limits.minimumIntervalDays ? '最短间隔' : '时期边界'}</span>
              <strong>{product.limits.minimumIntervalDays ? `${product.limits.minimumIntervalDays} 天` : '5叶期后禁用'}</strong>
            </article>
          </div>

          {assessment.kind !== 'danger' && (
            <div className="remaining-note">本次使用后，本季还可使用本品 <strong>{usesRemainingAfter} 次</strong>。</div>
          )}
        </section>
      </div>

      <section className="support-grid">
        <article className="support-card mixing-card">
          <div className="card-label">混配限制解释</div>
          <h3>不得与{product.mixing.restrictedCategory}混用</h3>
          <p>{product.mixing.plainExplanation}</p>
          <div className="example-row">
            {product.mixing.restrictedExamples.map((item) => <span key={item}>{item}</span>)}
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

      <footer>{dataset.disclaimer}</footer>
    </main>
  );
}
