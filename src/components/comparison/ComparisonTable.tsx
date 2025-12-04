'use client'

import { motion } from 'framer-motion'
import { Check, X, Minus } from 'lucide-react'

interface ComparisonFeature {
  name: string
  values: Record<string, boolean | string | null> // null = N/A, boolean = yes/no, string = custom value
}

interface ComparisonTableProps {
  title?: string
  columns: string[] // e.g., ['Classic', 'Hybrid', 'Volume', 'Mega Volume']
  features: ComparisonFeature[]
  className?: string
}

export function ComparisonTable({
  title,
  columns,
  features,
  className = ''
}: ComparisonTableProps) {
  const renderValue = (value: boolean | string | null) => {
    if (value === null) return <Minus className="w-4 h-4 text-dune/30" />
    if (value === true) return <Check className="w-5 h-5 text-emerald-500" />
    if (value === false) return <X className="w-5 h-5 text-red-400" />
    return <span className="text-sm text-dune">{value}</span>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-sm border border-sage/10 overflow-hidden ${className}`}
    >
      {title && (
        <div className="p-6 border-b border-sage/10">
          <h3 className="text-xl font-serif text-dune">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sage/10">
              <th className="text-left p-4 text-sm font-medium text-dune/60">Feature</th>
              {columns.map((col) => (
                <th key={col} className="text-center p-4 text-sm font-semibold text-dune">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, i) => (
              <tr
                key={feature.name}
                className={i % 2 === 0 ? 'bg-cream/30' : 'bg-white'}
              >
                <td className="p-4 text-sm text-dune">{feature.name}</td>
                {columns.map((col) => (
                  <td key={col} className="p-4 text-center">
                    {renderValue(feature.values[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
