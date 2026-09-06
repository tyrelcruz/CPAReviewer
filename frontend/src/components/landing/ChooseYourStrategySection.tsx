import { ArrowRight, Sparkle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import mountainLandscape from '@/assets/images/mountain_landscape.png'
import kabisEmblem from '@/assets/logo/kabis_emblem.png'
import { STRATEGY_CARDS } from '@/components/quiz/StrategyOptions'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

export function ChooseYourStrategySection() {
  return (
    <section id="product">
      <div className="relative overflow-hidden bg-[#520b07] px-6 py-16 text-[#F3ECDC] sm:py-20">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-7xl">
          <img
            src={mountainLandscape}
            alt=""
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-36 w-auto object-contain object-bottom-right opacity-90 sm:h-48 lg:h-64"
          />
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center"
        >
          <div>
            <motion.div
              variants={fadeUpItem}
              className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#E0AC48] uppercase"
            >
              <span aria-hidden="true">〜</span>
              Practice smarter
            </motion.div>
            <motion.h2
              variants={fadeUpItem}
              className="font-display text-4xl leading-[1.05] uppercase sm:text-5xl"
            >
              <span className="text-white">Choose your</span>
              <br />
              <span className="text-[#E0AC48]">Study Approach</span>
            </motion.h2>
            <motion.p variants={fadeUpItem} className="font-reading mt-5 max-w-lg text-[#F3ECDC]/75">
              KABIS gives you more than just questions — it gives you the right way to study.
              Pick a strategy that fits your goals, learning style, and exam journey.
            </motion.p>
          </div>

          <motion.div variants={fadeUpItem} className="hidden items-center justify-end gap-5 lg:flex">
            <img
              src={kabisEmblem}
              alt=""
              aria-hidden="true"
              className="h-36 w-36 shrink-0 object-contain"
            />
            <div className="text-right">
              <p className="font-serif text-2xl leading-tight font-bold text-[#F3ECDC]">
                Same goal.
                <br />
                Different paths.
              </p>
              <Sparkle className="mt-2 ml-auto size-4 text-[#E0AC48]" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="bg-[#FBF3EA] px-6 py-16 sm:py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3"
        >
          {STRATEGY_CARDS.map((card) => (
            <motion.div
              key={card.key}
              variants={fadeUpItem}
              className="flex flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-6"
            >
              <card.Icon />
              <h3 className="font-serif mt-5 text-lg font-bold text-[#7A2323] uppercase">
                {card.title}
              </h3>
              <p className="font-reading mt-2 text-sm text-[#3A2A1A]/75">{card.description}</p>

              <div className="mt-5 flex items-start gap-2.5 border-t border-[#3A2A1A]/10 pt-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E0AC48]/20 text-[#B4791F]">
                  <Sparkle className="size-3.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#3A2A1A] uppercase">
                    {card.whyLabel}
                  </p>
                  <p className="font-reading mt-1 text-xs text-[#3A2A1A]/70">{card.whyText}</p>
                </div>
              </div>

              <Link
                to="/signup"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#7A2323] px-5 py-3 text-sm font-semibold tracking-wide text-[#F3ECDC] uppercase transition-transform hover:scale-[1.02]"
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-14 flex items-center justify-center gap-3 text-[#3A5A40]">
          <span className="text-lg tracking-widest">〜〜〜</span>
          <Sparkle className="size-4 shrink-0" />
          <span className="text-lg tracking-widest">〜〜〜</span>
        </div>
      </div>
    </section>
  )
}
