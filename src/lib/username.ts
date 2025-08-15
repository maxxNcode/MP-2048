const adjectives = ['brave','swift','clever','mighty','calm','bright','fuzzy','lucky','noble','sly']
const nouns = ['otter','tiger','falcon','dragon','panda','eagle','wolf','lion','whale','fox']

export function generateUsername() {
  const adj = adjectives[Math.floor(Math.random()*adjectives.length)]
  const noun = nouns[Math.floor(Math.random()*nouns.length)]
  const num = Math.floor(100 + Math.random()*900)
  return `${adj}-${noun}-${num}`
}
