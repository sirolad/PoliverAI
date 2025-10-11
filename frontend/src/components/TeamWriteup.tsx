import useTeam from '@/hooks/useTeam'

export default function TeamWriteup() {
  const { heading, paragraph } = useTeam()

  return (
    <>
      <div className="flex justify-center">
        <div className="w-36 h-1 rounded-full bg-gradient-to-r from-blue-400 to-green-400 my-6" />
      </div>

      {/* Team write-up */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{heading}</h3>
          <p className="text-lg text-gray-600">{paragraph}</p>
        </div>
      </div>
    </>
  )
}
