import React from 'react';
import { BlendMode } from '../types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
      <span className="text-xs text-zinc-500 font-mono">{value.toFixed(1)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    />
  </div>
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between mb-4">
    <label className="text-sm font-medium text-zinc-300">{label}</label>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

interface SelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}

export const Select: React.FC<SelectProps> = ({ label, value, options, onChange }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
