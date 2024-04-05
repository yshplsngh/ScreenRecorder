import './App.css'
// import {useState} from "react";
// import {useState} from "react";

function App() {
    console.log("Mount");
    // const [canStart,setCanStart] = useState<boolean>(true);
    // const [canStop,setCanStop] = useState<boolean>(false);
    // const [chunk,setChunk]= useState<Blob>();
    // const [recorder,setRecorder]=useState<MediaRecorder|null>(null)
    // const [stream,setStream]=useState<MediaStream|null>(null)
    // const [audio,setAudio]=useState<MediaStream|null>(null)
    // const [mixedStream,setmixedStream] = useState()
    // let audio:MediaStream|null = null,
    //     mixedStream = null

    let startButton: boolean = true;
    let stopButton: boolean = false;
    let chunk: Blob[] = [];
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let audio: MediaStream | null = null;
    let mixedStream;


    async function setupStream() {
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
            });
            audio = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            })
            await setUpVideoFeedback();
        } catch (err) {
            console.log(err)
        }
    }

    async function setUpVideoFeedback() {
        if (stream) {
            const video = document.querySelector('.video-feedback') as HTMLVideoElement;
            video.srcObject = stream;
            await video.play();
        } else {
            console.log('No stream Available1')
        }
    }


    function handleDataAvailable(e: BlobEvent) {
        console.log(e.data);
        chunk.push(e.data)
    }

    function handleStop() {
        const blob = new Blob(chunk, {'type': 'video/mp4'});
        chunk = [];
        const downloadButton = document.querySelector('.download-video') as HTMLAnchorElement
        if (downloadButton) {
            downloadButton.href = URL.createObjectURL(blob);
            downloadButton.download = 'video.mp4';
        }
        const recordedVideo = document.querySelector('.recorded-video') as HTMLVideoElement
        recordedVideo.src = URL.createObjectURL(blob)
        recordedVideo.load()
        recordedVideo.onloadeddata = async function () {
            await recordedVideo.play()
        }

        if(stream && audio){
            stream.getTracks().forEach((track) => track.stop());
            audio.getTracks().forEach((track) => track.stop());
        }
    }

    async function startRecording() {
        await setupStream();

        if (stream && audio) {
            mixedStream = new MediaStream([...stream.getTracks(), ...audio.getTracks()]);
            recorder = new MediaRecorder(mixedStream);
            recorder.ondataavailable = handleDataAvailable;
            recorder.onstop = handleStop;
            recorder.start(1000);

            startButton = false;
            stopButton = true;
            console.log('Recording started');
        } else {
            console.log('No stream Available')
        }
    }

    function stopRecording() {
        if (recorder) {
            recorder.stop();
            startButton = true;
            stopButton = false;
            console.log('recording stopped');
        } else {
            console.log('recorder is null even after starting recording');
        }
    }

    return (
        <section>
            <button onClick={startRecording} className={'border-2 border-amber-500'}>start recording</button>
            <button onClick={stopRecording} className={'border-2 border-amber-500'}>stop recording</button>
            <video src="" className="video-feedback bg-black w-96 h-64 mb-4" autoPlay></video>

            <div className="recorded-video-wrap">
                <h2 className="text-xl text-gray-500 uppercase font-light mb-4">
                    Recorded video
                </h2>

                <video src="" className="recorded-video bg-black w-full h-auto mb-8" controls></video>
                <div className="flex flex-wrap -mx-4">
                    <a className="download-video text-center mx-4 flex-1 bg-gradient-to-br from-purple-500 to to-pink-500 p-4 uppercase text-lg font-bold transition-all duration-300 hover:opacity-90 disabled:opacity-50">
                        Download
                    </a>
                </div>
            </div>

        </section>
    )
}

export default App
