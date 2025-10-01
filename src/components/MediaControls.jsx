function MediaControls({
  isPlaying,
  isLiked,
  onPlayPause,
  onSkip,
  onLikeToggle,
  textColor
}) {
  const buttonStyle = {
    color: `rgb(${textColor.join(',')})`,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 1rem'
  }

  return (
    <div id="buttons" className="center">
      <button
        onClick={onLikeToggle}
        className="btn btn-default media-control-button"
        style={buttonStyle}
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        <i className="material-icons">
          {isLiked ? 'favorite' : 'favorite_border'}
        </i>
      </button>

      <button
        onClick={onPlayPause}
        className="btn btn-default media-control-button"
        style={buttonStyle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <i className="material-icons">
          {isPlaying ? 'pause' : 'play_arrow'}
        </i>
      </button>

      <button
        onClick={onSkip}
        className="btn btn-default media-control-button"
        style={buttonStyle}
        aria-label="Skip"
      >
        <i className="material-icons">skip_next</i>
      </button>
    </div>
  )
}

export default MediaControls