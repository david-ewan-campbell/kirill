class StreamOneEventMode
  def initialize
    @streaming_enabled = true
  end

  def should_stream?
    @streaming_enabled
  end

  def streamed_one_event
    @streaming_enabled = false
  end
end