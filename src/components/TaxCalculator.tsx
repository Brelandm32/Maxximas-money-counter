import React, { useState } from 'react';

type Mode = 'annual' | 'monthly' | 'hourly';

interface TaxBreakdown {
  gross: number;
  federalTax: number;
  stateTax: number;
  takeHome: number;
  monthly: number;
  weekly: number;
  hourly: number;
  fedAlloc: { label: string; amount: number }[];
  stateAlloc: { label: string; amount: number }[];
}

const federalBrackets = {
  single: [
    { rate: 0.1, cap: 11000 },
    { rate: 0.12, cap: 44725 },
    { rate: 0.22, cap: 95375 },
    { rate: 0.24, cap: 182100 },
    { rate: 0.32, cap: 231250 },
    { rate: 0.35, cap: 578125 },
    { rate: 0.37, cap: Infinity },
  ],
  married: [
    { rate: 0.1, cap: 22000 },
    { rate: 0.12, cap: 89450 },
    { rate: 0.22, cap: 190750 },
    { rate: 0.24, cap: 364200 },
    { rate: 0.32, cap: 462500 },
    { rate: 0.35, cap: 693750 },
    { rate: 0.37, cap: Infinity },
  ],
};

// 🔢 Realistic state income tax rate approximations
const stateTaxRates: Record<string, number> = {
  AL: 0.05, AK: 0.0, AZ: 0.025, AR: 0.049, CA: 0.093, CO: 0.045, CT: 0.05, DE: 0.052,
  FL: 0.0, GA: 0.057, HI: 0.0825, ID: 0.059, IL: 0.0495, IN: 0.0323, IA: 0.06,
  KS: 0.057, KY: 0.05, LA: 0.06, ME: 0.0715, MD: 0.0525, MA: 0.05, MI: 0.0425,
  MN: 0.059, MS: 0.05, MO: 0.05, MT: 0.068, NE: 0.06, NV: 0.0, NH: 0.0, NJ: 0.0637,
  NM: 0.049, NY: 0.0685, NC: 0.0475, ND: 0.021, OH: 0.0368, OK: 0.05, OR: 0.09,
  PA: 0.0307, RI: 0.051, SC: 0.07, SD: 0.0, TN: 0.0, TX: 0.0, UT: 0.0495, VT: 0.063,
  VA: 0.0575, WA: 0.0, WV: 0.052, WI: 0.053, WY: 0.0, DC: 0.065,
};
const spending: Record<string, { label: string; percent: number }[]> = {
  fed: [
    { label: 'Social Security & Medicare', percent: 0.3 },
    { label: 'Defense & Veterans', percent: 0.17 },
    { label: 'Health Programs', percent: 0.14 },
    { label: 'Interest on Debt', percent: 0.08 },
    { label: 'Safety Net Programs', percent: 0.08 },
    { label: 'Education & Training', percent: 0.06 },
    { label: 'Infrastructure & Science', percent: 0.04 },
    { label: 'Other Spending', percent: 0.13 },
  ],
  AL: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.08 },
    { label: 'Other Services', percent: 0.15 },
  ],
  AK: [
    { label: 'Public Safety', percent: 0.3 },
    { label: 'Healthcare', percent: 0.25 },
    { label: 'Education', percent: 0.2 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.15 },
  ],
  AZ: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.1 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.14 },
  ],
  AR: [
    { label: 'Education', percent: 0.37 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.08 },
    { label: 'Other Services', percent: 0.13 },
  ],
  CA: [
    { label: 'Education', percent: 0.38 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Transportation', percent: 0.08 },
    { label: 'Public Safety', percent: 0.07 },
    { label: 'Other Services', percent: 0.18 },
  ],
  CO: [
    { label: 'Education', percent: 0.34 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Transportation', percent: 0.11 },
    { label: 'Public Safety', percent: 0.11 },
    { label: 'Other Services', percent: 0.16 },
  ],
  CT: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.32 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.12 },
  ],
  DE: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  FL: [
    { label: 'Education', percent: 0.39 },
    { label: 'Healthcare', percent: 0.27 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  GA: [
    { label: 'Education', percent: 0.4 },
    { label: 'Healthcare', percent: 0.26 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.1 },
  ],
  HI: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  ID: [
    { label: 'Education', percent: 0.38 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  IL: [
    { label: 'Education', percent: 0.34 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  IN: [
    { label: 'Education', percent: 0.33 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.12 },
    { label: 'Other Services', percent: 0.12 },
  ],
  IA: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.15 },
  ],
  KS: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.27 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.11 },
    { label: 'Other Services', percent: 0.13 },
  ],
  KY: [
    { label: 'Education', percent: 0.34 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.08 },
    { label: 'Other Services', percent: 0.15 },
  ],
  LA: [
    { label: 'Education', percent: 0.32 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.15 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.14 },
  ],
  ME: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.31 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  MD: [
    { label: 'Education', percent: 0.37 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.1 },
  ],
  MA: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.32 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.11 },
  ],
  MI: [
    { label: 'Education', percent: 0.33 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.15 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  MN: [
    { label: 'Education', percent: 0.38 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.12 },
  ],
  MS: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.08 },
    { label: 'Other Services', percent: 0.13 },
  ],
  MO: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.13 },
  ],
  MT: [
    { label: 'Education', percent: 0.34 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.11 },
    { label: 'Other Services', percent: 0.12 },
  ],
  NE: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.27 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.11 },
    { label: 'Other Services', percent: 0.12 },
  ],
  NV: [
    { label: 'Education', percent: 0.39 },
    { label: 'Healthcare', percent: 0.26 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  NH: [
    { label: 'Education', percent: 0.37 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  NJ: [
    { label: 'Education', percent: 0.38 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.1 },
  ],
  NM: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  NY: [
    { label: 'Education', percent: 0.34 },
    { label: 'Healthcare', percent: 0.32 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.12 },
  ],
  NC: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.12 },
  ],
  ND: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.15 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  OH: [
    { label: 'Education', percent: 0.33 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.15 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  OK: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.27 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.11 },
    { label: 'Other Services', percent: 0.13 },
  ],
  OR: [
    { label: 'Education', percent: 0.34 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.13 },
  ],
  PA: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.13 },
  ],
  RI: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.13 },
  ],
  SC: [
    { label: 'Education', percent: 0.37 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.08 },
    { label: 'Other Services', percent: 0.13 },
  ],
  SD: [
    { label: 'Education', percent: 0.33 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.12 },
    { label: 'Other Services', percent: 0.11 },
  ],
  TN: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.13 },
  ],
  TX: [
    { label: 'Education', percent: 0.4 },
    { label: 'Healthcare', percent: 0.26 },
    { label: 'Public Safety', percent: 0.1 },
    { label: 'Transportation', percent: 0.06 },
    { label: 'Other Services', percent: 0.18 },
  ],
  UT: [
    { label: 'Education', percent: 0.38 },
    { label: 'Healthcare', percent: 0.27 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.11 },
    { label: 'Other Services', percent: 0.11 },
  ],
  VT: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.11 },
  ],
  VA: [
    { label: 'Education', percent: 0.37 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  WA: [
    { label: 'Education', percent: 0.39 },
    { label: 'Healthcare', percent: 0.26 },
    { label: 'Public Safety', percent: 0.12 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.13 },
  ],
  WV: [
    { label: 'Education', percent: 0.34 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.14 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  WI: [
    { label: 'Education', percent: 0.36 },
    { label: 'Healthcare', percent: 0.29 },
    { label: 'Public Safety', percent: 0.13 },
    { label: 'Transportation', percent: 0.1 },
    { label: 'Other Services', percent: 0.12 },
  ],
  WY: [
    { label: 'Education', percent: 0.35 },
    { label: 'Healthcare', percent: 0.28 },
    { label: 'Public Safety', percent: 0.15 },
    { label: 'Transportation', percent: 0.09 },
    { label: 'Other Services', percent: 0.13 },
  ],
  DC: [
    { label: 'Education', percent: 0.39 },
    { label: 'Healthcare', percent: 0.3 },
    { label: 'Public Safety', percent: 0.1 },
    { label: 'Transportation', percent: 0.08 },
    { label: 'Other Services', percent: 0.13 },
  ],
};
const allStates = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN',
  'MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA',
  'WA','WV','WI','WY','DC'
];

const TaxCalculator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('annual');
  const [status, setStatus] = useState<'single' | 'married'>('single');
  const [state, setState] = useState('CA');
  const [annual, setAnnual] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [hourly, setHourly] = useState(0);
  const [hours, setHours] = useState(40);
  const [weeks, setWeeks] = useState(52);
  const [result, setResult] = useState<TaxBreakdown | null>(null);

  const compute = () => {
    let gross = 0;
    if (mode === 'annual') gross = annual;
    if (mode === 'monthly') gross = monthly * 12;
    if (mode === 'hourly') gross = hourly * hours * weeks;

    const brackets = federalBrackets[status];
    let fedTax = 0;
    let remain = gross;

    for (let i = 0; i < brackets.length && remain > 0; i++) {
      const prevCap = i === 0 ? 0 : brackets[i - 1].cap;
      const taxable = Math.min(remain, brackets[i].cap - prevCap);
      fedTax += taxable * brackets[i].rate;
      remain -= taxable;
    }

    const stateRate = stateTaxRates[state] ?? 0;
    const stateTax = gross * stateRate;
    const takeHome = gross - fedTax - stateTax;
    const monthlyNet = takeHome / 12;
    const weeklyNet = takeHome / 52;
    const hourlyNet = hours > 0 && weeks > 0 ? takeHome / (hours * weeks) : 0;

    const fedAlloc = spending['fed'].map((item) => ({
      label: item.label,
      amount: +(item.percent * fedTax).toFixed(2),
    }));

    const stateAlloc = spending[state]
      ? spending[state].map((item) => ({
          label: item.label,
          amount: +(item.percent * stateTax).toFixed(2),
        }))
      : [];

    setResult({
      gross,
      federalTax: fedTax,
      stateTax,
      takeHome,
      monthly: monthlyNet,
      weekly: weeklyNet,
      hourly: hourlyNet,
      fedAlloc,
      stateAlloc,
    });
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Take-Home Pay Calculator</h2>

      <label><strong>Income Type:</strong></label>
      <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
        <option value="annual">Annual</option>
        <option value="monthly">Monthly</option>
        <option value="hourly">Hourly</option>
      </select>

      {mode === 'annual' && (
        <input
          type="number"
          placeholder="Annual Salary"
          value={annual}
          onChange={(e) => setAnnual(+e.target.value)}
        />
      )}
      {mode === 'monthly' && (
        <input
          type="number"
          placeholder="Monthly Salary"
          value={monthly}
          onChange={(e) => setMonthly(+e.target.value)}
        />
      )}
      {mode === 'hourly' && (
        <>
          <input
            type="number"
            placeholder="Hourly Rate"
            value={hourly}
            onChange={(e) => setHourly(+e.target.value)}
          />
          <input
            type="number"
            placeholder="Hours per Week"
            value={hours}
            onChange={(e) => setHours(+e.target.value)}
          />
          <input
            type="number"
            placeholder="Weeks per Year"
            value={weeks}
            onChange={(e) => setWeeks(+e.target.value)}
          />
        </>
      )}

      <br />

      <label>Filing Status:</label>
      <select value={status} onChange={(e) => setStatus(e.target.value as 'single' | 'married')}>
        <option value="single">Single</option>
        <option value="married">Married</option>
      </select>

      <label>State:</label>
      <select value={state} onChange={(e) => setState(e.target.value)}>
        {allStates.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <button onClick={compute}>Calculate</button>

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Results</h3>
          <p><strong>Gross Income:</strong> ${result.gross.toFixed(2)}</p>
          <p><strong>Federal Tax:</strong> ${result.federalTax.toFixed(2)}</p>
          <p><strong>State Tax:</strong> ${result.stateTax.toFixed(2)}</p>
          <p><strong>Take-Home Pay:</strong> ${result.takeHome.toFixed(2)}</p>

          <h4>Per Period Breakdown</h4>
          <p><strong>Monthly:</strong> ${result.monthly.toFixed(2)}</p>
          <p><strong>Weekly:</strong> ${result.weekly.toFixed(2)}</p>
          <p><strong>Hourly:</strong> ${result.hourly.toFixed(2)}</p>

          <h4>Federal Spending Allocation</h4>
          <ul>
            {result.fedAlloc.map((item, i) => (
              <li key={i}>{item.label}: ${item.amount.toLocaleString()}</li>
            ))}
          </ul>

          {result.stateAlloc.length > 0 ? (
            <>
              <h4>State Spending Allocation ({state})</h4>
              <ul>
                {result.stateAlloc.map((item, i) => (
                  <li key={i}>{item.label}: ${item.amount.toLocaleString()}</li>
                ))}
              </ul>
            </>
          ) : (
            <p><em>No state-level spending breakdown available for {state}.</em></p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;

