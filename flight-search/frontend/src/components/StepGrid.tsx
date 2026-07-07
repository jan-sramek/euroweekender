import { useTranslation } from 'react-i18next';
import './StepGrid.css';

export function StepGrid() {
  const { t } = useTranslation();

  const steps = [
    { number: '01', title: t('howItWorks.step1title'), text: t('howItWorks.step1text') },
    { number: '02', title: t('howItWorks.step2title'), text: t('howItWorks.step2text') },
    { number: '03', title: t('howItWorks.step3title'), text: t('howItWorks.step3text') },
    { number: '04', title: t('howItWorks.step4title'), text: t('howItWorks.step4text') }
  ];

  return (
    <div className="step-grid">
      {steps.map(step => (
        <article key={step.number} className="step-card">
          <span className="step-number">{step.number}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>
      ))}
    </div>
  );
}
