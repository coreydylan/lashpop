'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

export function WelcomeSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      {/* Background Image - No overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/desk.jpg"
          alt="LashPop Studio Desk"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content Container with Safe Zone */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Text Area - Takes up top portion, leaving bottom 35% as safe zone */}
        <div className="flex-1 flex items-center justify-center px-6 pb-[35vh]">
          <motion.div
            className="container max-w-5xl text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="137px"
                height="176px"
                viewBox="0 0 137 176"
                className="w-32 h-auto md:w-40 lg:w-48"
                style={{ filter: 'brightness(0) saturate(100%) invert(37%) sepia(18%) saturate(1089%) hue-rotate(287deg) brightness(92%) contrast(87%)' }}
              >
                <defs>
                  <filter id="dusty-rose-filter">
                    <feColorMatrix
                      type="matrix"
                      values="0.545 0 0 0 0
                              0 0.353 0 0 0
                              0 0 0.420 0 0
                              0 0 0 1 0"
                    />
                  </filter>
                </defs>
                <image
                  x="0px"
                  y="0px"
                  width="137px"
                  height="176px"
                  filter="url(#dusty-rose-filter)"
                  xlinkHref="data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIkAAACwCAQAAACRWIUnAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfpCxYHFgd4ju9JAAARuklEQVR42u2debAc1XWHv9Pd8wToSaCFRSzGCFlGCpsjICwGCxygSOEYCm+AqSKpxC4H4wRwmVSBYxsCMZiKwS5TVKqC40QYJ7GNyoTFFGEJkrCMDBFikxE4rAahDW1vme77yx/dM2/27lnem5knnamS6k3fucvXp0/fe+6595rgCL7KXEKMchE+L3ATb2KI5sXKcnQNU/o4q0ihiiQgD7Oo+ucqpmgsypTKNJ/HOQDVTOvweJHTebdpKD6uqk1WA4vh43AGaC/msYAFHMK+zEzqE7GJDfyOl3iRV2wEQD5GZKqEkV7B0nT10ZiWcDE7ydW5nmcvbuUKfCKyiyF85jGLCAOMHaxlpAqsjwPEbM7iXE7k4Lr1gGFe50nu5RHbLAM8i1QsrBmxNCjaqkYSSXpOA0ImMn48oZP0tMKyfF7RR5Nr8ceXJ2RarLu0SZKTFCmvvPIKFRU/YfJdlKR5T3fqFJmQJz9znao+JP/WQuJSkbyqaU0gMaGDtD75bWk+r2tGMZ8Yx/lamTQ0VF5hw7o4hRpNMDs9qU8mWLLfqqxYMiB5RYNNIAmE/krSaEVOo5L+WsiXr5zQR/SwJCdXpk3p4hTKyUl6WIuEAgWdheJlMMHNy941HlUfuAQP4YDrWMnHiYgw/CZNgY8REfFxnuQmBgibzKFUIai2Rd44AKn9wvUQizgDx2E8ztfxcPgELZYQ4OPw+RpPcQwRU1qvrCqgjA+S+qAu5FiWcRIhXttlexh5FrKCCxlpGW4VlIlE4gEX8AhzcAQdeWCNHI49+TFXEZJrPc8YSoylDbYtNACmI1xHb4SHI+IWpnAjAWF7UCYaSYyl8+bcw4i4AToBxSb0wRk/MTxCbuAvCdu3KZMDSfxqFndwZjuvZHpOSxwhYdn7MP7GZfp1fIN/yMHJuKplKL2CxOHwCAhwbOJt/o532AwEBHi4TFg8Ig7i+2TxADSQiTavtSQi7tu+xMM8yjreYydDTGVP5jCP01jMAgyHUh8Jn4jz+HPubHLkXi4pI4rWxjhXS8pnHLNEkkb1M52hAaA47ij5DGix7tZIxUCyfm5van9QUVOaHvd0FUk85HtCx4NMpkCBfJlM8d9+MqgzoSP1S0lhKpa8pO/BmOOgJuYeRRJ7SP5WnpAvr3BPa1S/4Bm5TDtTdcVJGtIRIK9UT7LrS/fMq8PYwif4Nh6+ReYapo3wCfgBZ7MRr6GdMCL24HJKjKwl3fVsVrdbSITHNs7lfgLCTKYwIiTgCc5mAz6NfIsecKEOtkglrbOkb9qrSOKn43MsJ9dUBzwkx2/4TA0vbqkYETO4qLp12aB0B4nDuJb7Ccg3+cs8AY9yNWmTIHChzEJZ5YV0KN1A4vB5gpuwloZoIR63cV/DnoeHOJbTarUvHUq3bMktRG2V/XXChhbFAee0lvXEIxEeEW+QZS6qXnN9nuEuSOnmnwG15gbT9KQ7WuK1M1olhnlbQz3xgKM1t7R3kr1y3RBlHN3WE4dnz/AY9fXEcEzhD6k5BGysJ70yEm5WPGAppFiTY2lhVNyvSBzwCHmCulAMWEiavZlESASs42VoiGS+zJya1JO+RSKfPKtpZE1gNlPrXaxvTfoVSdzkV1PSTGN/mrYm/YtEwBspDR6opyWNpH+RAGxKuR4wlV1ISwC2N2hwHAa2V/OZ9jeSxn1go4VXcL8jmUX9l7AwHFtoeizVv0gA5qZc38lGdh0tsRA4ivrmVcBWNtb9/aRDEj82RzZogYDXLA+m2hcb+RX6UTzgVKY3mBIXsBbUtGemX5EAXNDwqgHPscs4B4xIh3JOw/p7wK+p2TNRwzmP/kTiAZexd4PHxmG8wQu04OHtRyQeEfP5YsPaC3jS3pdfbVwb60h/IgG4oaFpjWVpa1n3H5Icjkv5FK7BCEf4bORRaliSNB3pHpJWQ6d88pyYGnwVAUvtnerHJh1I9yYtopbKDohYyH8yiGuIxAfupMq0ZgHSHSTC57Dk/+xiBIQs4iEOTomvjjDutxWy0pgVZQTSDSTx3b2bv2eQCCPIACZekRHyeR7hoNSAcw/4TmnbVHORSe8gieuW4xpWcSlT4oCbscCsqrQ+Ho6QA1jCvzE1dXo9wrjXHpNnUSEUK1k/mrF63bElhhFyOD9kDdcwHysEZsknUECQxLvGU6WOg/gWz3IxUepssvAZ5huFYZ01iSPOo3vhe3mNyEnaqUf0VZ2gQagK39tPn9Zd2iwpSlKnxzPeODbYa2VxWzdDgQNAhOzB6ZyOY6PW8SbvaAsejr2Zw1zmMy3J5TOQmmNEwG+4XuBajdTofnS0ESDyOHz2Zd+q62IUyGWqp/DZwRcYais2uutIYiyFBdOuGKIai4eXQTcKQBw+l/F0e0CsJ5CUImhdHD7X8qN2FikVlmtMBhGj+NzODXjtAumt9TitAwkZ4A4uw2s5/o2xrlz/IwkJyfFNvoRXYYlaAGL0hnltD0jAKF/knwiIOgGke0gc7WtoHsjxKpewAr99G1KQbj04HrTTCBwhOXL8gGNZQdDea7c8Iqk7zgF4gy0EOEYqFjhm+fUoeTwCVvJRvsyOdt4y8fin3PXSDSQR8BOO4i5GmFLsvWaBERECOXK8yCWcwnJ8WgqYKACptTtStx6cHG9zCQv4BuvwyOERPwy1mhejiLsMAaM8xCc4xpYkoectAinoR7VzrptvnByvcR3f5njO4wyOSsDUqr2PMLawivtZyu8AU0DY9LC/BEb9iMZuIokwPEZZznKMQziZo1nI4cxkkFzS1mG2sZ61PM8qVrEFiDXbWagStc8GZixtfcdtd50DBbd0AET2Oq/zExAMMpMpSSt3sImRYnqvfBl17U3BKvFUXkmbHOiFrlqYKLMPCGfbtb2iTZagqLmqvNBEFROXi0qySRP1CJJClaO4UqrctU/ZVmaUoxn7ttkpox5CUmyE1MbgrZ0NBybLsK/jshtJUQqquRtJIt3ZMatPZDcSgAof+G6pkN1IqOzJ7EZSJbuRVI2Jdnkk1R3lXR5JteziSGoNpnZxJLVkl0ZSe8C9SyOpLbswksm2RKltmWyLTzogk29tXwdksuxMMR57T1dIvyApnGlQmM/ym92opXamtaQHPfRV4gMRETDATEI24YgM+ZK1t81Uzbj63kfiEWH8EZ/iZA5nLxxbeYnH9VPWYvLahVJDuhAwnpf0XVF6uk1JfSgJ8zb5QifolxWh4k7SiJZoHqjtm9o7+71mESPiKpZxFpQFWoiIHBezShdZ2Pzi6MpCyqWXkXg4vs8tGCGWrLwoXPGBkGncpb+xqF0o/YLEx3E1Xyasc2SMEWBEfFcXtQul+4FZWcQj4mSuQ/iNDk/DgFt1mLURvlcJpVeRCPgWAynLGsEjZF+u6WTRvYnER5zEH2cy/z7wWR3WbpHdj3tNl/Mg0+kURsQg57ZfYKGo3kTigMU0EyqyuBPFxsX1IBIZYgYHZkbiAUd2rvweRJIcQDUjMxKAaZ0ruheRAB04r61F6c0lSgK28T7NxPmOZE6ZKj2IxISxgbcyI3HAmkmNJKnV8qZ+0Vzq1MJ7U36esXbCZ6jVHW1qSW8iiTAe51Esw9KjCPgPWzvZkcRvw78jn7qm0xGwiRs6WfT4IClsCFH/apo4fJZxLcZog2DxeMnS5fZyJz0mnUciYCM0UPkIeDcVTYTHzXyPKbg6eYUYA1xpP5bfrnOgvAWd9r2a0N56oe6ZWE7SZh2h0nPKK4iWnLGFrtCIpLyGNaq8QoUKNaphhZI26dOt7MI40UjihszXA9qqbTU+m/WkTi8HUm4uSqDE7ujj9FAF3njXkyWaCwo6MaNTKqY08+XxKsewPfNWQlDYzWCfmo+l432iytzKW1W2kZOHAxZxAacxhymIYX7L//Bze1mGdX7SYnyQJIvN6gKrOlOt1rKi4voan2QKS1OZimM7w1b2fWdlvKa2GlVV6b2NUkQWgTzMItvBDgCZPFxHTeoEIOmwJFqSkLIMUFuXPkESi7W1miur9GrvtYuyG0mV7EZSJVlsiREY8nGAJuZ57nUk8TEIUSkMFXyjGp++QTclrasmjM3cwe8ZYRNbeY+NbGerle0YIg8PN1nQpCGpRpRnA+vZwFu8zFpe5zV7t3gxjiiL+vvhyoIk7hhZ4gWpHI5s4TWeZTVPs9o2F9F4uH4F06yWxBgcY6vRCzbF2MIaVvIYT9n6BIyPxqvb3VtIqhGpbNPjzazkAR5knblYY/oLSyeQjKFxqBihmucZfsE9vGQOFPSPvnQSSUEcEY4BDBhhGT9iqW2Lz2zth7fSeCApRePjAW+xhH+OXT5Yr2vLeCKBeEtJkcMY5j7+0Vb0gbak7sbcCXHKK5IU6r90PLFPtXdHVxOCJMYyorykUd2tw0Fer0IxpcUMdlYiwGc7t3GTbRsv72l/IYn7wh4eb/AVWzo+Pvb2xOMFymfmqidWOitx6LfjYO7R3exrTgOdnolpF8ntQLy3bhgfplD2d/knwnUIV3wow+d4SufYKF5vQUHf0UgygyaFGtKwhhueC+AUakRDGlFeYYYTBOpL/OsbFcjaX0TSKTF55jSXA+O/2MkQBkwjhxCzGWA605nJDGYxi1kcwEymlNifeEc8a+pglzGJEAEP8nnb2OHJ7jaQNGXg5DGVfTiEDzKXDzCP DzC7CCMkwm+4DKAeFp8XOd/WasBaOMa040gAVNqM+ns7qtoHon04lCM5gUUcxfRkMjdqWmdCAt7jfFuuHGG3/SwtmLV4pIKVuxY1m+M4jbNYyJ4UNsvPrjEOjyG+YEsUJEeejrPIyCUxTvmOdgNk8hWMBTTI1x/oK3pQQ4n5TD8SpiCRIkm3KDceARJV9Q7G+s6y8n50B4uWX9iNEzSX87mEo7EmVhDGB3U8xZ/Z8/LGb3okzlseZ3EmgzzHv9t62Tg+rvILd0CeFuunGpYUZdQWp7yknbpaOZDf8fiiRDsU6LNaleim9JYWxePzcRWZfJkMNFd3aEhSlLEHEz9Az+rMBGvHqloYfetPtUaSU6S88spLWqeZY3EJ4wsmkC8DzdMShZLymbC4RKfu1QkJljZtSyEHmf5EyxMrFxbLG5X0zXGIeatbHZMnA52qp5rQFadIUl736CQlHYXWqqxkdwLtqc9oWaKH1Quxf6/9JkhPitXyQYGu0rCyHEwWS+x2clqmSzUjrrD8geal3obS9+CHdZ1eUTwUCWuUFEq6aQL1JKmWJx90jFYnVcgmhTv6nv5F52pWWX6BfHnyZDKZPHmVwOTrCF2pJzRSUzvK9eR9zZ0AI1t17wLQoP41s1Up3MN8Uv13dY+u0CmanVLSgD6sC3SrVmm0aJ2ihmXkJd2adCQmlEriitb1XItrcnuWqLigSmziNV7iVd5kPTvZQISYwVRmcgAfYD4f4kCmFH/nZdpt3djBMfZKF9yfia58TVKYcudqKXg+9X6P3fesKQu6KH0JFEy4l8NEKN9u1lZux1KPOK34cTEeJt6b3io0wJV812zLBPG5gV3xklukwO7gbNbjkW/JTxefglI5rKz1XTNInqGVc0M6IzINgObqV1KbnrlOSNw5XKFgQvsmNbD4oJxulpOafO47KWFyS9bo0C4DAVCgAHSqnpcUNdFb6ZRESV9lnS7X4IT3SupAid8/0/UP2qHm/CvtSdxTcZKe1V9oGqiXZgmUUwBaqKVJZcf7EYqSgYK0QudrD5DXa3NJyJKR6sf0UMk97LyExV7zNv1MZ8jigUG3218Pi68BAH1M9yXd8E5al7G8Iv1aV8ZbwCjoOe2ogSUeyH9Et+vdRLnDtjQmdhO5RPde0PU6LnEkWb1xb48xkuHHnn/N4Fwu5FQGEUYIVX3VxhJPucUdtzyr+QX3scby6ZGWPYYkARMPDs2kOZzDJzmR/YoNDXF4ybRJef1F4RgqjyA5x3IjK3mAh+y3SZIM4Rs9iSTB4hGZZCbN5DhOYRFHMifjwdxbeZ5f8d+sKsRuKz73LUN3vWeRJA0pi7PWIIexgHl8kA8wh73Yo3iYHcAQo2xlHWv4X1bzdnHxW5OR2v8PighPgCMa6lgAAAAASUVORK5CYII="
                />
              </svg>
            </motion.div>

            <motion.p
              className="text-xl md:text-2xl font-light mb-6 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ color: '#8B5A6B' }} // Dark dusty rose
            >
              Where artistry meets precision in every lash application.
              Our studio is more than a beauty destination—it&apos;s a sanctuary
              where confidence blooms and natural beauty is enhanced with
              meticulous care and expertise.
            </motion.p>

            <motion.p
              className="text-lg md:text-xl font-light mb-8 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ color: '#8B5A6B', opacity: 0.9 }} // Slightly lighter
            >
              Each service is tailored to your unique features, ensuring
              results that feel authentically you. From classic elegance to
              bold volume, we craft looks that elevate your natural radiance.
            </motion.p>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-3"
                style={{ color: '#8B5A6B' }}>
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Explore our services using the menu above
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Safe Zone - Bottom 35% of screen where no text appears */}
        {/* This area stays empty to preserve the visual elements in the desk image */}
      </div>
    </section>
  )
}