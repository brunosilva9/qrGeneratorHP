export default function QrCard({ qr, code }) {

  if (!qr) return null

  return (
    <div className="card">

      <div className="qrBox">

        <div className="qrBorder">

          <img
            src={qr}
            alt={code}
            className="qrImage"
          />

        </div>

      </div>

      <div className="labelBox">

        <img
          src="/logo.png"
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