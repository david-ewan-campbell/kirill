require 'rspec'
require 'rack/test'
require 'test_doubles/streaming_mode/streaming_disabled_mode'
require 'test_doubles/streaming_mode/stream_one_event_mode'

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
      app.streaming_mode = StreamingDisabledMode.new

      response = get '/api/listen'

      expect(response.status).to eq(200)
    end

    it "GET request returns correct content-type header for Server Sent Events" do
      app.streaming_mode = StreamingDisabledMode.new

      response = get '/api/listen'

      response_headers = response.content_type.split(";")
      expect(response_headers).to include("text/event-stream")
    end
  end

  context "note-on and listen endpoints interacting" do
    it "correctly formed Server Sent Event is sent for each note-on request" do
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