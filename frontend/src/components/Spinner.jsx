import "../assets/Spinner.css"

export const Spinner = ({ size = "medium", fullScreen = false }) => {
  const sizeClass = {
    small: "spinnerSmall",
    medium: "spinnerMedium",
    large: "spinnerLarge"
  }[size]

  const spinner = (
    <div className={`spinner ${sizeClass}`}>
      <div className="spinnerCircle"></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="spinnerFullScreen">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default Spinner
