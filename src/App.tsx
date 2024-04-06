import './App.css'
import {useState} from "react";
// import {useState} from "react";
// import {useState} from "react";

function App() {
    console.log("Mount");
    const [canStart,setCanStart] = useState<boolean>(true);
    const [message,setMessage] = useState<string>('')
    // const [canStop,setCanStop] = useState<boolean>(false);
    // const [chunk,setChunk]= useState<Blob>();
    const [recorder,setRecorder]=useState<MediaRecorder|null>(null)
    // const [stream,setStream]=useState<MediaStream|null>(null)
    // const [audio,setAudio]=useState<MediaStream|null>(null)
    // const [mixedStream,setmixedStream] = useState()
    // let audio:MediaStream|null = null,
    //     mixedStream = null

    let stream: MediaStream | null = null;
    let chunk: Blob[] = [];
    // let recorder: MediaRecorder;


    async function setupStream() {
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
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
        console.log('yes');
        setCanStart(true)
        setMessage('');
        const blob = new Blob(chunk, {type: 'video/mp4'});
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
            const rc = document.querySelector(".recorded-video-wrap") as HTMLDivElement
            rc.classList.remove("hidden");
            rc.scrollIntoView({ behavior: "smooth", block: "start" });
            await recordedVideo.play()
        }
        stream && stream.getTracks().forEach((track) => track.stop());
        console.log('stopped');
    }

    async function startRecording() {
        await setupStream();

        if (stream) {
            const record = new MediaRecorder(new MediaStream([...stream.getTracks()]));
            setRecorder(record);
            record.ondataavailable = handleDataAvailable;
            record.onstop = handleStop;
            record.start(1000);
            // recorder.ondataavailable = handleDataAvailable

            setCanStart(false);
            setMessage('Recording... 📷')
            console.log('Recording started');
        } else {
            console.log('No stream Available')
        }
    }

    function stopRecording() {
        console.log('from here')
        if (recorder) {
            recorder.stop();
            console.log('recording stopped');
        } else {
            console.log('recorder is null even after starting recording');
        }
    }

    const startButt:string = !canStart ? 'border-red-800':''
    const stopButt:string = canStart ? 'border-red-800':''

    return (
        <section>
            <button onClick={startRecording} disabled={!canStart} className={`border-2 border-amber-500 ${startButt}`}>start recording</button>
            <button onClick={stopRecording} disabled={canStart} className={`border-2 border-amber-500 ${stopButt}`}>stop recording</button>
            <p>{message}</p>
            <video src="" className="video-feedback bg-black w-96 h-64 mb-4" autoPlay></video>

            <div className="recorded-video-wrap hidden">
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
