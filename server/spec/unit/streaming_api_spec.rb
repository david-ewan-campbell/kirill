require 'rspec'
require 'rack/test'

def app
  Kirill
end

describe "Streaming API" do
  include Rack::Test::Methods

  context "note-on endpoint" do
    it "POST request returns HTTP status 200" do
      response = post '/api/note-on'

      expect(response.status).to eq(200)
      expect(response.body).to eq("OK")
    end
  end

  context "listen endpoint" do
    it "GET request returns HTTP status 200" do
      # app.streaming_mode = StreamingDisabledMode.new

      response = get '/api/listen'

      expect(response.status).to eq(200)
    end

    xit "GET request returns correct content-type header for Server Sent Events" do
      app.streaming_mode = StreamingDisabledMode.new

      response = get '/api/listen'

      response_headers = response.content_type.split(";")
      expect(response_headers).to include("text/event-stream")
    end
  end

  context "note-on and listen endpoints interacting" do
    # I observed some flakiness of this test, probably due to the concurrency involved, hence the retry attempts.
    xit "correctly formed Server Sent Event is sent for each note-on request", :retry => 3 do
      app.streaming_mode = StreamOneEventMode.new

        # send POST requests to the note-on endpoint repeatedly in the background
        Thread.new {
          10.times do
            post '/api/note-on'
            sleep 0.1
          end
        }

        response = get '/api/listen'
        # always expect frequency of 100Hz for now, to keep it simple.
        expect(response.body).to eq("event:note-on\ndata:{\"frequency\":100}\n\n")
    end
  end
end

class StreamOneEventMode
  def initialize
    @streaming_enabled = true
  end

  def should_stream
    @streaming_enabled
  end

  def streamed_one_event
    @streaming_enabled = false
  end
end

class StreamingDisabledMode
  def should_stream
    false
  end

  def streamed_one_event
  end
end