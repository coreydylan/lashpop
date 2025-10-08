'use client'

import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className="py-8 bg-cream border-t border-sage/10">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="caption text-dune/60">
            © 2025 LashPop Studios • Oceanside, CA
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="caption text-dune/60 hover:text-dusty-rose transition-colors">
              Privacy
            </a>
            <a href="#" className="caption text-dune/60 hover:text-dusty-rose transition-colors">
              Terms
            </a>
            <a href="#" className="caption text-dune/60 hover:text-dusty-rose transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}