export const getCoveringPeriod = () => {
  const month = new Date().getMonth() + 1
  const year  = new Date().getFullYear()
  return month <= 6 ? `Q1 ${year}` : `Q2 ${year}`
}