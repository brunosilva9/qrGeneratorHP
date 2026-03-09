export default function QrCard({ qr, code }) {

  if (!qr) return null

  return (
    <div className="card">

      <div className="qrBox">
        <img
          src={qr}
          alt={code}
          className="qrImage"
        />
      </div>

      <div className="labelBox">

        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="logo"
          className="labelLogo"
        />

        <span className="labelText">
          {code}
        </span>

      </div>

    </div>
  )
}