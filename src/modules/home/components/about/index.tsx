type AboutProps = {
  content?: string | null
}

const About = ({ content }: AboutProps) => {
  if (!content) {
    return null
  }

  return (
    <section className="content-container lg:pt-24 pt-10">
      <div
        className="prose max-w-5xl text-center text-body mx-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  )
}

export default About
