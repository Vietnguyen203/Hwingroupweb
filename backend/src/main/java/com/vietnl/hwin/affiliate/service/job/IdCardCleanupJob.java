package com.vietnl.hwin.affiliate.service.job;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.AffiliateStatus;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.service.config.AffiliateProperties;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.storage.PrivateFileStore;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Job hằng ngày dọn ảnh CCCD (dữ liệu cá nhân nhạy cảm):
 * <ol>
 *   <li>Hồ sơ CTV bị TỪ CHỐI quá {@code id-card-retention-days} ngày: bỏ tham chiếu ảnh (ghi audit).</li>
 *   <li>Tệp ảnh không còn hồ sơ nào tham chiếu (tải lên nhưng không đăng ký, hoặc ảnh cũ sau khi đăng ký lại / bị xóa tham chiếu)
 *       và đã tồn tại quá 24 giờ: xóa khỏi kho riêng tư. Khoảng chờ 24 giờ để không xóa nhầm ảnh người dùng vừa tải mà chưa kịp gửi phiếu.</li>
 * </ol>
 * Hồ sơ đang chờ duyệt / đã duyệt / tạm khóa giữ nguyên ảnh (cần cho đối soát chi trả).
 */
@Component
public class IdCardCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(IdCardCleanupJob.class);
    private static final String FOLDER = "id-cards";
    /** Ảnh mới tải trong khoảng này chưa bị coi là mồ côi. */
    static final Duration ORPHAN_GRACE = Duration.ofHours(24);

    private final AffiliateRepository affiliates;
    private final PrivateFileStore files;
    private final AffiliateProperties props;
    private final AuditLogger audit;
    private final TransactionTemplate tx;
    private final Clock clock;

    public IdCardCleanupJob(AffiliateRepository affiliates, PrivateFileStore files, AffiliateProperties props,
                            AuditLogger audit, TransactionTemplate tx, Clock clock) {
        this.affiliates = affiliates;
        this.files = files;
        this.props = props;
        this.audit = audit;
        this.tx = tx;
        this.clock = clock;
    }

    @Scheduled(cron = "${hwin.affiliate.id-card-cleanup-cron:0 30 3 * * *}")
    public void run() {
        Instant now = clock.instant();
        int purged = purgeRejected(now);
        int deleted = deleteOrphans(now);
        if (purged > 0 || deleted > 0) {
            log.info("Dọn ảnh CCCD: bỏ tham chiếu {} hồ sơ bị từ chối quá hạn, xóa {} tệp mồ côi", purged, deleted);
        }
    }

    /** @return số hồ sơ bị từ chối quá hạn lưu giữ đã bỏ tham chiếu ảnh. */
    public int purgeRejected(Instant now) {
        Instant cutoff = now.minus(props.idCardRetention());
        List<Affiliate> due = affiliates.findByStatusAndReviewedAtBeforeAndIdCardFrontKeyIsNotNull(AffiliateStatus.REJECTED, cutoff);
        int count = 0;
        for (Affiliate a : due) {
            Boolean ok = tx.execute(s -> affiliates.findById(a.getId())
                    .filter(x -> x.getStatus() == AffiliateStatus.REJECTED && x.hasIdCard())
                    .map(x -> {
                        x.purgeIdCard();
                        affiliates.save(x);
                        audit.log("affiliate", "Affiliate", x.getId(), "ID_CARD_PURGED", null, null,
                                "{\"reason\":\"REJECTED_RETENTION_EXPIRED\"}");
                        return true;
                    }).orElse(false));
            if (Boolean.TRUE.equals(ok)) {
                count++;
            }
        }
        return count;
    }

    /** @return số tệp mồ côi (không hồ sơ nào tham chiếu, cũ hơn {@link #ORPHAN_GRACE}) đã xóa. */
    public int deleteOrphans(Instant now) {
        Set<String> referenced = new HashSet<>(affiliates.allFrontKeys());
        referenced.addAll(affiliates.allBackKeys());
        Instant cutoff = now.minus(ORPHAN_GRACE);
        int count = 0;
        for (PrivateFileStore.StoredEntry e : files.list(FOLDER)) {
            // kiểm tra lại tham chiếu ngay trước khi xóa (phòng hồ sơ vừa đăng ký xong giữa lúc job đang chạy)
            if (!referenced.contains(e.key()) && e.lastModified().isBefore(cutoff)
                    && !affiliates.existsByIdCardFrontKeyOrIdCardBackKey(e.key(), e.key()) && files.delete(e.key())) {
                count++;
            }
        }
        return count;
    }
}
