'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

const team = [
  {
    name: 'Emily Rogers',
    role: 'Owner & Master Artist',
    type: 'employee',
    specialties: ['Classic Lashes', 'Volume Lashes', 'Hybrid Lashes'],
    image: '/lashpop-images/team/emily-rogers.jpeg',
    phone: '(760) 212-0448',
    instagram: '@emilyrogersbeauty',
    bio: 'Emily founded LashPop Studios with a vision of creating a space where beauty professionals could thrive. With over 8 years of experience in lash artistry, she specializes in creating natural, effortless looks that enhance each client\'s unique beauty.',
    funFact: 'I started doing lashes in my living room and now run a full studio!',
    favoriteServices: ['Classic Extensions', 'Lash Lifts']
  },
  {
    name: 'Savannah Scherer',
    role: 'Lash Artist',
    type: 'employee',
    specialties: ['Volume Lashes', 'Mega Volume'],
    image: '/lashpop-images/team/savannah-scherer.jpeg',
    phone: '(760) 212-0448',
    instagram: '@savannahslashes',
    bio: 'Savannah is known for her precision and attention to detail. She creates stunning volume sets that are both dramatic and wearable.',
    funFact: 'I\'ve done over 1,000 lash appointments!',
    favoriteServices: ['Volume Extensions', 'Hybrid Sets']
  },
  {
    name: 'Grace Ramos',
    role: 'Lash Artist',
    type: 'employee',
    specialties: ['Classic Lashes', 'Lash Lifts'],
    image: '/lashpop-images/team/grace-ramos.jpg',
    phone: '(760) 212-0448',
    instagram: '@graceslashes',
    bio: 'Grace specializes in classic sets and lash lifts, creating natural enhancements that clients love.',
    funFact: 'I love creating natural looks that make mornings easier!',
    favoriteServices: ['Classic Extensions', 'Lash Lift & Tint']
  },
  // Add more team members as needed
]

export function EnhancedTeam() {
  const [selectedMember, setSelectedMember] = useState<typeof team[0] | null>(null)

  return (
    <section id="team" className="py-[var(--space-xl)] bg-ocean-mist/10">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="caption text-golden">Our Team</span>
          <h2 className="h2 text-dune mt-2 mb-6">
            Meet the Collective
          </h2>
          <p className="body-lg text-dune/70 max-w-2xl mx-auto">
            Each member of our team has been hand-selected for their exceptional skill,
            professionalism, and commitment to the LashPop standard of beauty.
          </p>
        </motion.div>

        {/* Collective Model Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-cream arch-full p-8 mb-16 max-w-3xl mx-auto"
        >
          <h3 className="text-xl font-light text-dune mb-4">Our Collective Model</h3>
          <p className="body text-dune/70 mb-4">
            LashPop Studios is home to both employees and independent artists. Whether you book with
            a team member or an independent professional, you can expect the same high standard of
            service, skill, and care.
          </p>
          <p className="body text-dune/70">
            Every artist in our collective has been carefully selected to ensure they align with our
            values of effortless beauty, professionalism, and exceptional client care.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setSelectedMember(member)}
              className="group cursor-pointer"
            >
              <div className="relative mb-4">
                <div className="aspect-[3/4] rounded-[100px_100px_0_0] overflow-hidden bg-cream">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                {member.type === 'renter' && (
                  <div className="absolute top-4 right-4 bg-dusty-rose text-white px-3 py-1 rounded-full text-xs">
                    Independent
                  </div>
                )}
              </div>
              <h4 className="text-lg font-light text-dune">{member.name}</h4>
              <p className="caption text-dusty-rose mb-2">{member.role}</p>
              <p className="text-sm text-dune/60">{member.phone}</p>
              <div className="mt-3 space-y-1">
                {member.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="inline-block text-xs bg-sage/10 text-sage px-2 py-1 rounded-full mr-1"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
              <button className="btn btn-primary w-full mt-4 text-sm py-2">
                View Profile
              </button>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="fixed inset-0 bg-dune/80 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-cream arch-full p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-light text-dune">{selectedMember.name}</h3>
                    <p className="caption text-dusty-rose">{selectedMember.role}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-dune/60 hover:text-dune text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                    <Image
                      src={selectedMember.image}
                      alt={selectedMember.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-dune mb-2">About</h4>
                      <p className="body text-dune/70">{selectedMember.bio}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-dune mb-2">Fun Fact</h4>
                      <p className="body text-dune/70">{selectedMember.funFact}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-dune mb-2">Favorite Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.favoriteServices.map((service) => (
                          <span
                            key={service}
                            className="text-sm bg-sage/10 text-sage px-3 py-1 rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-dune mb-2">Contact</h4>
                      <p className="text-sm text-dune/70">{selectedMember.phone}</p>
                      <p className="text-sm text-dusty-rose">{selectedMember.instagram}</p>
                    </div>

                    <div className="space-y-2 pt-4">
                      <button className="btn btn-primary w-full">
                        Book with {selectedMember.name.split(' ')[0]}
                      </button>
                      <button className="btn btn-secondary w-full">
                        See Their Work
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
