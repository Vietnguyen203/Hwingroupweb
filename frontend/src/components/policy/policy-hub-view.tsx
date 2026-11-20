"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Lock,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { siteConfig } from "@/lib/config";
import { CertificateGallery } from "@/components/policy/certificate-gallery";
import { cn } from "@/lib/utils";

type TabKey = "vsattp" | "bao-mat" | "doi-tra" | "kiem-hang" | "dieu-khoan";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "vsattp", label: "Chứng nhận VSATTP & Kiểm định", icon: Award },
  { key: "bao-mat", label: "Chính sách bảo mật", icon: Lock },
  { key: "doi-tra", label: "Chính sách đổi trả 7 ngày", icon: RotateCcw },
  { key: "kiem-hang", label: "Kiểm hàng & Vận chuyển", icon: Truck },
  { key: "dieu-khoan", label: "Điều khoản giao dịch TMĐT", icon: Scale },
];

export function PolicyHubView() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const urlTab = TABS.find((t) => t.key === tabParam)?.key ?? null;
  // Mục đang chọn: theo tham số ?tab= của URL (link ở chân trang / header đổi URL thì đổi mục), bấm mục khác thì giữ lựa chọn đó.
  const [state, setState] = useState<{ url: TabKey | null; key: TabKey }>({ url: urlTab, key: urlTab ?? "vsattp" });
  if (state.url !== urlTab) setState({ url: urlTab, key: urlTab ?? state.key });
  const activeTab = state.key;
  const setActiveTab = (key: TabKey) => setState((s) => ({ ...s, key }));

  // Phím mũi tên / Home / End đổi mục (đúng mẫu ARIA tabs), focus đi theo mục vừa chọn
  const onTabKeyDown = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.key === activeTab);
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setActiveTab(TABS[next].key);
    document.getElementById(`policy-tab-${TABS[next].key}`)?.focus();
  };

  return (
    // Màn hình rất rộng (2xl): mở rộng khung ra hai bên để danh sách mục nằm ở vùng lề trái, nội dung giữ nguyên độ rộng
    <div className="px-3 py-6 md:py-10 2xl:-mx-40">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Cột phải (trên): đường dẫn + banner */}
        <div className="min-w-0 space-y-8 lg:col-start-2 lg:row-start-1">
          {/* Breadcrumb */}
          <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-sm text-neutral-600 sm:text-base">
            <Link href="/" className="font-medium transition-colors hover:text-brand">Trang chủ</Link>
            <ChevronRight className="size-4 shrink-0 text-neutral-400" />
            <span className="font-semibold text-neutral-900">Chính sách &amp; Pháp lý</span>
          </nav>

          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-brand-deep p-6 text-white shadow-xl md:p-10">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/15 text-amber-300">
                <ShieldCheck className="size-4 text-emerald-400" />
                Minh bạch pháp lý – An tâm sức khỏe
              </div>
              <h1 className="text-2xl font-black tracking-tight md:text-4xl text-white">
                Chính Sách &amp; Hồ Sơ An Toàn Vệ Sinh Thực Phẩm
              </h1>
              <p className="text-sm leading-relaxed text-white/80 md:text-base">
                Phúc Vị Foods cam kết tuân thủ nghiêm ngặt quy định pháp luật Việt Nam về Thương mại điện tử (Nghị định 52/2013/NĐ-CP &amp; 85/2021/NĐ-CP) cùng tiêu chuẩn Vệ sinh an toàn thực phẩm Quốc gia.
              </p>
            </div>

            {/* Decorative Watermark */}
            <div className="pointer-events-none absolute -right-8 -bottom-10 opacity-10">
              <Shield className="size-80 text-white" />
            </div>
          </div>
        </div>

        {/* Danh sách mục: cột trái cố định khi cuộn (desktop), thanh tab cuộn ngang (mobile / tablet) */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <p className="mb-3 hidden px-2 text-xs font-extrabold text-neutral-400 lg:block">Mục chính sách</p>
          <div
            role="tablist"
            aria-label="Mục chính sách và pháp lý"
            onKeyDown={onTabKeyDown}
            className="no-scrollbar flex gap-1 overflow-x-auto border-b border-neutral-200 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:rounded-2xl lg:border lg:border-neutral-200/80 lg:bg-white lg:p-3 lg:shadow-card"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`policy-tab-${tab.key}`}
                  aria-selected={isActive}
                  aria-controls="policy-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "group flex shrink-0 items-center gap-3 rounded-xl border-b-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap transition-all duration-200 lg:w-full lg:rounded-2xl lg:border-b-0 lg:py-3.5 lg:text-left lg:text-[15px] lg:whitespace-normal xl:py-4 xl:text-base",
                    isActive
                      ? "border-brand bg-brand/5 text-brand lg:bg-brand lg:text-white lg:shadow-lg lg:shadow-brand/25"
                      : "border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors lg:size-10 xl:size-11",
                      isActive ? "bg-brand/10 text-brand lg:bg-white/20 lg:text-white" : "bg-neutral-100 text-neutral-500 group-hover:bg-white",
                    )}
                  >
                    <Icon className="size-5 lg:size-6" />
                  </span>
                  <span className="lg:flex-1 lg:leading-snug">{tab.label}</span>
                  <ChevronRight className={cn("hidden size-4 shrink-0 transition lg:block", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Cột phải (dưới): nội dung của mục đang chọn */}
        <div id="policy-panel" role="tabpanel" aria-labelledby={`policy-tab-${activeTab}`} className="min-w-0 space-y-8 lg:col-start-2 lg:row-start-2">
        {/* Tab 1: Ảnh giấy chứng nhận do Admin tải lên */}
        {activeTab === "vsattp" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-neutral-100 pb-4">
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Award className="size-6 text-emerald-600" />
                Hồ Sơ Năng Lực &amp; Giấy Chứng Nhận Chất Lượng
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Giấy chứng nhận, giấy phép và kết quả kiểm nghiệm của Phúc Vị Foods được cập nhật trực tiếp bởi ban quản trị. Bấm vào ảnh để xem rõ.
              </p>
            </div>

            <CertificateGallery />
          </section>
        )}

        {/* Tab 2: Chính sách bảo mật (Nghị định 13/2023/NĐ-CP) */}
        {activeTab === "bao-mat" && (
          <article className="space-y-6 rounded-2xl border border-neutral-200/80 bg-white p-6 md:p-10 shadow-xs animate-in fade-in duration-300 text-neutral-700 text-sm leading-relaxed">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-bold text-neutral-900 md:text-2xl flex items-center gap-2.5">
                <Lock className="size-6 text-brand" />
                Chính Sách Bảo Mật Thông Tin Khách Hàng
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Ban hành theo Luật An toàn thông tin mạng &amp; Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-neutral-900">1. Mục đích thu thập thông tin</h3>
              <p>
                Khi quý khách thực hiện giao dịch hoặc đăng ký tài khoản tại website <strong>{siteConfig.name}</strong>, chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để phục vụ đơn hàng:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                <li>Họ và tên người nhận hàng.</li>
                <li>Số điện thoại và địa chỉ giao nhận thực phẩm.</li>
                <li>Địa chỉ email để gửi hóa đơn điện tử và mã OTP bảo mật.</li>
                <li>Thông tin thanh toán (Mã giao dịch ngân hàng đối với hình thức chuyển khoản).</li>
              </ul>

              <h3 className="text-base font-bold text-neutral-900 pt-3">2. Phạm vi sử dụng dữ liệu</h3>
              <p>Thông tin thu thập được chỉ sử dụng trong các trường hợp sau:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                <li>Xử lý, đóng gói và điều phối vận chuyển đơn hàng đến tận nơi.</li>
                <li>Thông báo về tình trạng đơn hàng, xác nhận giao dịch thành công.</li>
                <li>Giải quyết các thắc mắc, khiếu nại, hỗ trợ đổi trả sản phẩm khi có phát sinh.</li>
                <li>Thực hiện nghĩa vụ thuế và xuất hóa đơn giá trị gia tăng (VAT) hợp pháp.</li>
              </ul>

              <h3 className="text-base font-bold text-neutral-900 pt-3">3. Cam kết bảo mật và Công nghệ mã hóa</h3>
              <p>
                Phúc Vị Foods áp dụng các tiêu chuẩn an ninh mạng nghiêm ngặt: Toàn bộ mật khẩu và mã OTP được băm bảo mật (Pepper + Salt), số CCCD và thông tin ngân hàng được mã hóa chuẩn <strong>AES-256</strong>. Chúng tôi tuyệt đối <strong>không bán, chia sẻ hoặc tiết lộ thông tin khách hàng</strong> cho bất kỳ bên thứ ba nào, trừ trường hợp cơ quan thực thi pháp luật Việt Nam yêu cầu theo đúng trình tự pháp luật.
              </p>

              <h3 className="text-base font-bold text-neutral-900 pt-3">4. Quyền của khách hàng đối với dữ liệu cá nhân</h3>
              <p>
                Quý khách có quyền truy cập vào mục &quot;Tài khoản của tôi&quot; để xem, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào bằng cách liên hệ hotline: <strong className="text-brand">{siteConfig.hotline}</strong> hoặc email: <strong>CeoHwinGroup@gmail.com</strong>.
              </p>
            </div>
          </article>
        )}

        {/* Tab 3: Chính sách đổi trả & Hoàn tiền */}
        {activeTab === "doi-tra" && (
          <article className="space-y-6 rounded-2xl border border-neutral-200/80 bg-white p-6 md:p-10 shadow-xs animate-in fade-in duration-300 text-neutral-700 text-sm leading-relaxed">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-bold text-neutral-900 md:text-2xl flex items-center gap-2.5">
                <RotateCcw className="size-6 text-brand" />
                Chính Sách Đổi Trả &amp; Hoàn Tiền Trong 7 Ngày
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Áp dụng cho toàn bộ các sản phẩm thực phẩm chế biến đóng gói phân phối bởi Phúc Vị Foods.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-neutral-900">1. Điều kiện chấp nhận đổi trả</h3>
              <p>Khách hàng được quyền yêu cầu đổi mới sản phẩm hoặc hoàn tiền 100% trong vòng <strong>07 ngày</strong> kể từ khi nhận hàng trong các trường hợp sau:</p>
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Được đổi trả miễn phí:
                  </p>
                  <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-emerald-950">
                    <li>Bao bì chân không bị rách, xì hơi trong quá trình vận chuyển.</li>
                    <li>Sản phẩm có mùi vị lạ, biến chất, ôi thiu không đạt chuẩn VSATTP.</li>
                    <li>Giao sai chủng loại hoặc số lượng so với đơn đã đặt.</li>
                    <li>Sản phẩm cận ngày hết hạn hoặc quá hạn sử dụng.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <p className="font-bold text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="size-4 text-rose-600" />
                    Không chấp nhận đổi trả:
                  </p>
                  <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-rose-950">
                    <li>Sản phẩm đã bị bóc seal, sử dụng quá 50% khối lượng.</li>
                    <li>Hư hỏng do khách hàng bảo quản sai hướng dẫn (ví dụ: không để ngăn đông -18°C đối với xúc xích, lạp xưởng tươi).</li>
                    <li>Quá thời hạn 07 ngày kể từ khi shipper bàn giao thành công.</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-base font-bold text-neutral-900 pt-3">2. Quy trình xử lý và Hoàn tiền</h3>
              <ol className="list-decimal pl-5 space-y-2 text-neutral-600">
                <li><strong>Bước 1:</strong> Chụp ảnh hoặc quay video tình trạng sản phẩm lỗi gửi qua Zalo Hotline <strong>{siteConfig.hotline}</strong>.</li>
                <li><strong>Bước 2:</strong> Bộ phận Chăm sóc khách hàng Phúc Vị tiếp nhận và phản hồi giải pháp trong vòng <strong>30 phút</strong>.</li>
                <li><strong>Bước 3:</strong> Phúc Vị cử shipper thu hồi sản phẩm lỗi và giao sản phẩm mới thay thế tận nhà, hoặc chuyển khoản hoàn tiền 100% trong vòng <strong>24 giờ làm việc</strong>.</li>
              </ol>
            </div>
          </article>
        )}

        {/* Tab 4: Kiểm hàng & Vận chuyển */}
        {activeTab === "kiem-hang" && (
          <article className="space-y-6 rounded-2xl border border-neutral-200/80 bg-white p-6 md:p-10 shadow-xs animate-in fade-in duration-300 text-neutral-700 text-sm leading-relaxed">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-bold text-neutral-900 md:text-2xl flex items-center gap-2.5">
                <Truck className="size-6 text-brand" />
                Chính Sách Kiểm Hàng &amp; Vận Chuyển Giao Nhận
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Căn cứ theo quy định tại Điều 34 Nghị định 85/2021/NĐ-CP sửa đổi Nghị định 52/2013/NĐ-CP về Thương mại điện tử.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-amber-700" />
                  Quy định Đồng Kiểm (Mở thùng kiểm tra trước khi nhận)
                </h3>
                <p className="mt-1 text-xs text-amber-950 leading-relaxed">
                  Khách hàng của Phúc Vị Foods có quyền và được khuyến khích <strong>đồng kiểm cùng nhân viên giao hàng</strong>: Được mở kiện hàng kiểm tra đúng mẫu mã, số lượng và tình trạng niêm phong bao bì trước khi ký nhận và thanh toán.
                </p>
              </div>

              <h3 className="text-base font-bold text-neutral-900 pt-2">1. Thời gian và Phạm vi giao hàng</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                <li><strong>Khu vực Nội thành (Hà Nội &amp; TP.HCM):</strong> Giao hàng hỏa tốc trong vòng <strong>02 giờ</strong> hoặc hẹn giờ theo yêu cầu của khách hàng.</li>
                <li><strong>Các tỉnh thành khác:</strong> Giao hàng trong vòng <strong>24 – 48 giờ</strong> qua dịch vụ chuyển phát xe lạnh chuyên dụng nhằm đảm bảo thực phẩm luôn giữ độ tươi ngon tuyệt đối.</li>
              </ul>

              <h3 className="text-base font-bold text-neutral-900 pt-2">2. Biểu phí giao hàng</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                <li>Đơn hàng dưới 500.000₫: Phí vận chuyển tiêu chuẩn là 30.000₫ toàn quốc.</li>
                <li>Đơn hàng từ <strong>500.000₫ trở lên: MIỄN PHÍ VẬN CHUYỂN (Freeship)</strong> 100%.</li>
              </ul>

              <h3 className="text-base font-bold text-neutral-900 pt-2">3. Trách nhiệm của bên vận chuyển</h3>
              <p>
                Đơn vị vận chuyển có trách nhiệm cung cấp chứng từ giao nhận hàng hóa đầy đủ. Trường hợp xảy ra mất mát, đổ vỡ hoặc chậm trễ do lỗi của bên vận chuyển, Phúc Vị Foods cam kết chịu trách nhiệm bồi thường hoặc gửi đơn hàng mới ngay lập tức cho quý khách.
              </p>
            </div>
          </article>
        )}

        {/* Tab 5: Điều khoản dịch vụ TMĐT */}
        {activeTab === "dieu-khoan" && (
          <article className="space-y-6 rounded-2xl border border-neutral-200/80 bg-white p-6 md:p-10 shadow-xs animate-in fade-in duration-300 text-neutral-700 text-sm leading-relaxed">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-bold text-neutral-900 md:text-2xl flex items-center gap-2.5">
                <Scale className="size-6 text-brand" />
                Điều Khoản Dịch Vụ &amp; Quy Chế Hoạt Động Thương Mại Điện Tử
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Website Thương mại điện tử Phúc Vị Foods thuộc quyền sở hữu của Công ty Cổ phần Tập đoàn HWIN.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-neutral-900">1. Thông tin đơn vị quản lý website</h3>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                <li><strong>Tên doanh nghiệp:</strong> CÔNG TY CỔ PHẦN TẬP ĐOÀN HWIN</li>
                <li><strong>Mã số doanh nghiệp:</strong> 0109887766 do Sở Kế hoạch và Đầu tư TP. Hà Nội cấp</li>
                <li><strong>Trụ sở chính:</strong> Khu đô thị The Manor Central Park, Phường Định Công, TP. Hà Nội</li>
                <li><strong>Hotline:</strong> {siteConfig.hotline} | <strong>Email:</strong> CeoHwinGroup@gmail.com</li>
              </ul>

              <h3 className="text-base font-bold text-neutral-900 pt-3">2. Quy định về giá và Hóa đơn giá trị gia tăng (VAT)</h3>
              <p>
                Giá sản phẩm niêm yết trên website là giá bán chính thức bằng đồng Việt Nam (VNĐ), đã bao gồm thuế giá trị gia tăng theo quy định. Khi hoàn tất đặt hàng, khách hàng có quyền yêu cầu xuất hóa đơn điện tử hợp pháp gửi trực tiếp vào email đăng ký.
              </p>

              <h3 className="text-base font-bold text-neutral-900 pt-3">3. Giải quyết khiếu nại và Tranh chấp</h3>
              <p>
                Mọi tranh chấp phát sinh trong quá trình giao dịch giữa Phúc Vị Foods và khách hàng sẽ được ưu tiên giải quyết trên tinh thần thương lượng và hòa giải. Trong trường hợp không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án nhân dân có thẩm quyền giải quyết theo quy định của pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
              </p>
            </div>
          </article>
        )}
        </div>
      </div>
    </div>
  );
}
