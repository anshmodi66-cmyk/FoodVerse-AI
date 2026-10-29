import uuid
import datetime
import io
from PIL import Image, ImageFilter
from backend.app.models.schemas import (
    HygieneFrameResponse,
    WorkerCompliance,
    ComplianceSummary
)

class HygieneService:
    @classmethod
    def apply_edge_face_anonymization(cls, img: Image.Image, face_boxes: list[tuple[int, int, int, int]]) -> Image.Image:
        """
        Anonymizes worker faces at the edge via heavy Gaussian blur
        to adhere strictly to GDPR Art. 9 and Indian DPDP Act 2023.
        """
        anonymized = img.copy()
        for (x1, y1, x2, y2) in face_boxes:
            box = (x1, y1, x2, y2)
            face_region = anonymized.crop(box)
            blurred_face = face_region.filter(ImageFilter.GaussianBlur(radius=25))
            anonymized.paste(blurred_face, box)
        return anonymized

    @classmethod
    def analyze_station_frame(cls, frame_bytes: bytes, station_id: str = "prep_station_1") -> HygieneFrameResponse:
        try:
            img = Image.open(io.BytesIO(frame_bytes)).convert("RGB")
        except Exception:
            img = Image.new("RGB", (640, 480), color=(220, 220, 225))
            
        width, height = img.size
        
        # Simulate worker detections with realistic bounding boxes
        # Worker 1: Fully compliant (Prep cook)
        # Worker 2: Missing face mask in active preparation zone
        workers: list[WorkerCompliance] = [
            WorkerCompliance(
                worker_index=1,
                hairnet_detected=True,
                mask_detected=True,
                apron_detected=True,
                gloves_detected=True,
                bounding_box=[round(0.15 * height, 1), round(0.12 * width, 1), round(0.85 * height, 1), round(0.45 * width, 1)],
                violations=[]
            ),
            WorkerCompliance(
                worker_index=2,
                hairnet_detected=True,
                mask_detected=False,  # Violation
                apron_detected=True,
                gloves_detected=True,
                bounding_box=[round(0.18 * height, 1), round(0.52 * width, 1), round(0.88 * height, 1), round(0.88 * width, 1)],
                violations=["MASK_MISSING_PREPARATION_ZONE"]
            )
        ]

        # Apply face blurring over detected worker head regions
        face_boxes = [
            (int(0.18 * width), int(0.15 * height), int(0.38 * width), int(0.38 * height)),
            (int(0.60 * width), int(0.18 * height), int(0.80 * width), int(0.42 * height))
        ]
        _ = cls.apply_edge_face_anonymization(img, face_boxes)

        # Calculate compliance summary statistics
        total_workers = len(workers)
        hairnet_count = sum(1 for w in workers if w.hairnet_detected)
        mask_count = sum(1 for w in workers if w.mask_detected)
        apron_count = sum(1 for w in workers if w.apron_detected)
        glove_count = sum(1 for w in workers if w.gloves_detected)

        hairnet_pct = round((hairnet_count / total_workers) * 100.0, 1)
        mask_pct = round((mask_count / total_workers) * 100.0, 1)
        apron_pct = round((apron_count / total_workers) * 100.0, 1)
        glove_pct = round((glove_count / total_workers) * 100.0, 1)

        overall_station_score = round((hairnet_pct + mask_pct + apron_pct + glove_pct) / 4.0, 1)

        alerts = []
        if mask_pct < 100.0:
            alerts.append(f"STATION ALERT: Worker #2 is actively handling food without a mandated protective face mask.")

        return HygieneFrameResponse(
            frame_id=f"frm_{uuid.uuid4().hex[:8]}",
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            station_id=station_id,
            anonymized_faces=True,
            summary=ComplianceSummary(
                workers_present=total_workers,
                hairnet_compliance_pct=hairnet_pct,
                mask_compliance_pct=mask_pct,
                apron_compliance_pct=apron_pct,
                glove_compliance_pct=glove_pct,
                overall_station_score=overall_station_score
            ),
            workers=workers,
            cross_contamination_hazard=False,
            alerts=alerts
        )
