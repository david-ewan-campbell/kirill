require 'sinatra'

class StreamingEnabledMode
  def should_stream
    true
  end

  def streamed_one_event
  end
end

class Kirill < Sinatra::Base

  get '/' do
    'Hi from Kirill!'
  end

  get '/listen' do
    erb :listen
  end

  post '/api/note-on' do
    'OK'
  end

  get '/api/listen' do
    content_type "text/event-stream"
  end

  run! if app_file == $PROGRAM_NAME
end