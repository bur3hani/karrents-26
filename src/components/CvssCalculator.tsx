import React, { useState, useEffect } from 'react';
import { Shield, Info, AlertTriangle, Copy, Check } from 'lucide-react';

interface MetricOption {
  label: string;
  value: string;
  score: number;
  scoreChanged?: number; // CVSS PR score changes if Scope is Changed
  desc: string;
}

interface MetricGroup {
  name: string;
  key: string;
  title: string;
  options: MetricOption[];
}

export default function CvssCalculator() {
  const [metrics, setMetrics] = useState<Record<string, string>>({
    AV: 'N',
    AC: 'L',
    PR: 'N',
    UI: 'N',
    S: 'U',
    C: 'H',
    I: 'H',
    A: 'H',
  });

  const [score, setScore] = useState<number>(10.0);
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('CRITICAL');
  const [vector, setVector] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const metricGroups: MetricGroup[] = [
    {
      name: 'Attack Vector (AV)',
      key: 'AV',
      title: 'How can the vulnerability be exploited?',
      options: [
        { label: 'Network', value: 'N', score: 0.85, desc: 'Exploitable from remote networks (Internet).' },
        { label: 'Adjacent', value: 'A', score: 0.62, desc: 'Requires local physical network access (e.g., Wi-Fi / LAN).' },
        { label: 'Local', value: 'L', score: 0.55, desc: 'Requires local terminal access, shell, or user execution.' },
        { label: 'Physical', value: 'P', score: 0.20, desc: 'Requires direct physical interaction with the hardware.' },
      ]
    },
    {
      name: 'Attack Complexity (AC)',
      key: 'AC',
      title: 'What specialized conditions are required?',
      options: [
        { label: 'Low', value: 'L', score: 0.77, desc: 'No special conditions. Exploitation is repeatable and consistent.' },
        { label: 'High', value: 'H', score: 0.44, desc: 'Requires bypass of system defenses or timing synchronization.' },
      ]
    },
    {
      name: 'Privileges Required (PR)',
      key: 'PR',
      title: 'What privileges are needed before attack?',
      options: [
        { label: 'None', value: 'N', score: 0.85, scoreChanged: 0.85, desc: 'Unauthenticated; no privileges needed.' },
        { label: 'Low', value: 'L', score: 0.62, scoreChanged: 0.68, desc: 'Standard user privileges.' },
        { label: 'High', value: 'H', score: 0.27, scoreChanged: 0.50, desc: 'Administrative or root level privileges.' },
      ]
    },
    {
      name: 'User Interaction (UI)',
      key: 'UI',
      title: 'Is another user required to participate?',
      options: [
        { label: 'None', value: 'N', score: 0.85, desc: 'No user interaction. Self-executing exploit.' },
        { label: 'Required', value: 'R', score: 0.62, desc: 'Requires a victim to click, import, or load an element.' },
      ]
    },
    {
      name: 'Scope (S)',
      key: 'S',
      title: 'Does exploitation impact other security scopes?',
      options: [
        { label: 'Unchanged', value: 'U', score: 1.0, desc: 'Affected component is the only impacted asset.' },
        { label: 'Changed', value: 'C', score: 1.0, desc: 'Can compromise components outside of its security authority.' },
      ]
    },
    {
      name: 'Confidentiality Impact (C)',
      key: 'C',
      title: 'What is the impact on data confidentiality?',
      options: [
        { label: 'High', value: 'H', score: 0.56, desc: 'Total information disclosure (database exfiltration).' },
        { label: 'Low', value: 'L', score: 0.22, desc: 'Partial data disclosure; limited technical leak.' },
        { label: 'None', value: 'N', score: 0.00, desc: 'No impact on confidentiality.' },
      ]
    },
    {
      name: 'Integrity Impact (I)',
      key: 'I',
      title: 'What is the impact on data integrity?',
      options: [
        { label: 'High', value: 'H', score: 0.56, desc: 'Total modification or deletion of host records.' },
        { label: 'Low', value: 'L', score: 0.22, desc: 'Partial unauthorized record tampering.' },
        { label: 'None', value: 'N', score: 0.00, desc: 'No impact on integrity.' },
      ]
    },
    {
      name: 'Availability Impact (A)',
      key: 'A',
      title: 'What is the impact on system availability?',
      options: [
        { label: 'High', value: 'H', score: 0.56, desc: 'Total service disruption / host crash.' },
        { label: 'Low', value: 'L', score: 0.22, desc: 'Partial degradation or rate-limiting disruption.' },
        { label: 'None', value: 'N', score: 0.00, desc: 'No impact on availability.' },
      ]
    }
  ];

  const handleMetricChange = (key: string, value: string) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    // CVSS v3.1 mathematical calculation formulas
    const avVal = metricGroups[0].options.find(o => o.value === metrics.AV)?.score || 0.85;
    const acVal = metricGroups[1].options.find(o => o.value === metrics.AC)?.score || 0.77;
    const prOpt = metricGroups[2].options.find(o => o.value === metrics.PR);
    const scopeVal = metrics.S; // 'U' or 'C'
    const prVal = scopeVal === 'C' ? (prOpt?.scoreChanged || 0.85) : (prOpt?.score || 0.85);
    const uiVal = metricGroups[3].options.find(o => o.value === metrics.UI)?.score || 0.85;

    const cVal = metricGroups[5].options.find(o => o.value === metrics.C)?.score || 0;
    const iVal = metricGroups[6].options.find(o => o.value === metrics.I)?.score || 0;
    const aVal = metricGroups[7].options.find(o => o.value === metrics.A)?.score || 0;

    // Exploitability subscore
    const exploitability = 8.22 * avVal * acVal * prVal * uiVal;

    // Impact subscore base calculations
    const iscBase = 1 - (1 - cVal) * (1 - iVal) * (1 - aVal);
    let isc = 0;
    if (scopeVal === 'U') {
      isc = 6.42 * iscBase;
    } else {
      isc = 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15);
    }

    let calculatedScore = 0;
    if (isc <= 0) {
      calculatedScore = 0;
    } else {
      if (scopeVal === 'U') {
        calculatedScore = Math.min(isc + exploitability, 10);
      } else {
        calculatedScore = Math.min(1.08 * (isc + exploitability), 10);
      }
    }

    // Round up to nearest 1 decimal point according to CVSS specification
    const roundedScore = Math.ceil(calculatedScore * 10) / 10;
    setScore(roundedScore);

    // Determine Severity
    if (roundedScore === 0) setSeverity('LOW');
    else if (roundedScore <= 3.9) setSeverity('LOW');
    else if (roundedScore <= 6.9) setSeverity('MEDIUM');
    else if (roundedScore <= 8.9) setSeverity('HIGH');
    else setSeverity('CRITICAL');

    // Build Vector String
    const vectorString = `CVSS:3.1/AV:${metrics.AV}/AC:${metrics.AC}/PR:${metrics.PR}/UI:${metrics.UI}/S:${metrics.S}/C:${metrics.C}/I:${metrics.I}/A:${metrics.A}`;
    setVector(vectorString);
  }, [metrics]);

  const copyVector = () => {
    navigator.clipboard.writeText(vector);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityColors = {
    LOW: 'bg-green-500/10 border-green-500/30 text-green-400',
    MEDIUM: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    HIGH: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div id="cvss-calculator-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {metricGroups.map((group) => (
          <div key={group.key} className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-5 space-y-3 shadow-sm hover:border-zinc-800/80 transition-all">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-200 text-sm tracking-tight">{group.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Info className="w-3.5 h-3.5 text-brand-neon/80" />
                <span>{group.title}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {group.options.map((opt) => {
                const isSelected = metrics[group.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    id={`btn-cvss-${group.key}-${opt.value}`}
                    onClick={() => handleMetricChange(group.key, opt.value)}
                    className={`flex flex-col text-left p-3 rounded-lg border text-xs transition-all relative ${
                      isSelected
                        ? 'bg-brand-neon/10 border-brand-neon text-brand-neon ring-2 ring-brand-neon/10'
                        : 'bg-zinc-950/40 border-zinc-800/50 hover:border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between w-full mb-1">
                      <span>{opt.label}</span>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                        {opt.value}
                      </span>
                    </div>
                    <span className="text-[10px] leading-relaxed text-zinc-500 hover:text-zinc-400">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Dynamic Score display */}
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 sticky top-6 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Calculated Severity
            </h3>
            <div className="flex justify-center items-baseline gap-2">
              <span className="text-6xl font-extrabold tracking-tight text-white font-mono">
                {score.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-zinc-400">/ 10</span>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${severityColors[severity]}`}>
              {severity} SEVERITY
            </span>
          </div>

          {/* Progress gauge */}
          <div className="relative w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                severity === 'LOW' ? 'bg-green-500' :
                severity === 'MEDIUM' ? 'bg-yellow-500' :
                severity === 'HIGH' ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${score * 10}%` }}
            />
          </div>

          {/* Vector block */}
          <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
              <span>Vector String</span>
              <button
                id="btn-copy-cvss-vector"
                onClick={copyVector}
                className="hover:text-white transition-colors flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800/60 hover:border-zinc-700"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs break-all text-brand-neon leading-normal p-2 bg-zinc-950 rounded border border-zinc-900/60 select-all">
              {vector}
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-zinc-400 leading-relaxed pt-2 border-t border-zinc-800/40">
            <div className="flex gap-2.5">
              <Shield className="w-4 h-4 text-brand-neon shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-zinc-300">CVSS v3.1 Standards</h4>
                <p>Calculated base score reflects the vulnerability severity irrespective of active mitigation techniques or temporal exploitation feeds.</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-zinc-300">Operational Guidance</h4>
                <p>Critical severity (9.0+) usually mandates emergency patching operations within 24 to 48 hours in SOC operational SLA runbooks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
