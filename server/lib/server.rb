require 'sinatra'

class StreamingEnabledMode
  def should_stream?
    true
  end

  def streamed_one_event
  end

end

class Kirill < Sinatra::Base

  @@streaming_mode = StreamingEnabledMode.new

  def self.streaming_mode=(new_streaming_mode)
    @@streaming_mode = new_streaming_mode
  end
  
  listeners = []

  get '/' do
    'Hi from Kirill!'
  end

  get '/listen' do
    erb :listen
  end

  post '/api/note-on' do
    listeners.each do |listener|
      listener << "event:note-on\ndata:{\"frequency\":100}\n\n"
      @@streaming_mode.streamed_one_event
    end
    'OK'
  end

  get '/api/listen' do
    content_type "text/event-stream"
    stream do |listener|
      listeners << listener
      while @@streaming_mode.should_stream? do
        trap "SIGINT" do
          exit 130
        end
      end
      listeners.delete(listener)
    end
  end

  run! if app_file == $PROGRAM_NAME
end