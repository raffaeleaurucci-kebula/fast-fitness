export function PublicHome() {
  return (
    <div>

      {/* HERO CAROUSEL */}
      <div id="homeCarousel" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">

          {/* Slide 1 */}
          <div className="carousel-item active">
            <img
              src="/home1.jpeg"
              className="d-block w-100"
              style={{ height: "500px", objectFit: "cover" }}
              alt="gym"
            />
            <div className="carousel-caption d-none d-md-block">
              <h2 className="fw-bold">Allenati al massimo</h2>
              <p>Raggiungi i tuoi obiettivi con FastFitness</p>
            </div>
          </div>

          {/* Slide 2 */}
          <div className="carousel-item">
            <img
              src="/home2.png"
              className="d-block w-100"
              style={{ height: "500px", objectFit: "cover" }}
              alt="training"
            />
            <div className="carousel-caption d-none d-md-block">
              <h2 className="fw-bold">Programmi personalizzati</h2>
              <p>Allenamenti su misura per te</p>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="carousel-item">
            <img
              src="/home3.jpeg"
              className="d-block w-100"
              style={{ height: "500px", objectFit: "cover" }}
              alt="fitness"
            />
            <div className="carousel-caption d-none d-md-block">
              <h2 className="fw-bold">Diventa la tua versione migliore</h2>
              <p>Programmi pensati per trasformare il tuo corpo e la tua mente</p>
            </div>
          </div>

        </div>

        {/* CONTROLLI */}
        <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" />
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" />
        </button>
      </div>

      {/* SEZIONE INFO */}
      <div className="container text-center my-5">
        <h2 className="mb-4">Perché scegliere FastFitness?</h2>

        <div className="row">
          <div className="col-md-4">
            <h4>🏋️‍♂️ Allenamenti</h4>
            <p>Piani personalizzati per ogni utente</p>
          </div>

          <div className="col-md-4">
            <h4>📊 Gestione</h4>
            <p>Organizza allenamenti e gestisci prenotazioni</p>
          </div>

          <div className="col-md-4">
            <h4>🔥 Motivazione</h4>
            <p>Raggiungi i tuoi obiettivi con costanza</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mb-5">
        <h3>Inizia oggi</h3>
        <p>Accedi o registrati per iniziare il tuo percorso</p>
        <button className="btn btn-primary me-2">Login</button>
        <button className="btn btn-outline-primary">Registrati</button>
      </div>

    </div>
  );
}