import mongoose from 'mongoose';
import { config } from './config/env.js';
import { Organization } from './models/organization.model.js';
import { User } from './models/user.model.js';
import { Template } from './models/template.model.js';
import { TemplateVersion } from './models/template-version.model.js';
import { MasterData } from './models/master-data.model.js';
import { Contract } from './models/contract.model.js';
import { ContractVersion } from './models/contract-version.model.js';

const seedData = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing collections
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Template.deleteMany({});
    await TemplateVersion.deleteMany({});
    await MasterData.deleteMany({});
    await Contract.deleteMany({});
    await ContractVersion.deleteMany({});

    console.log('[Seed] Cleared existing data.');

    // 1. Create Super Admin user
    const superAdmin = await User.create({
      fullName: 'Super Admin System',
      email: 'admin@mtctms.vn',
      passwordHash: '123456',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });
    console.log('[Seed] Super Admin created: admin@mtctms.vn / 123456');

    const now = new Date();
    const expires30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 2. Create Parent Organization (Root)
    const rootOrg = await Organization.create({
      name: 'Tập Đoàn Điện Tử ABC',
      code: 'ABC-CORP',
      parentOrganizationId: null,
      ancestors: [],
      level: 0,
      status: 'ACTIVE',
      plan: 'PRO',
      planExpiresAt: expires30Days,
    });

    // 3. Create Child Organizations
    const hnOrg = await Organization.create({
      name: 'Chi Nhánh Hà Nội',
      code: 'ABC-HN',
      parentOrganizationId: rootOrg._id,
      ancestors: [rootOrg._id],
      level: 1,
      status: 'ACTIVE',
      plan: 'PRO',
      planExpiresAt: expires30Days,
    });

    const hcmOrg = await Organization.create({
      name: 'Chi Nhánh TP.HCM',
      code: 'ABC-HCM',
      parentOrganizationId: rootOrg._id,
      ancestors: [rootOrg._id],
      level: 1,
      status: 'ACTIVE',
      plan: 'PRO',
      planExpiresAt: expires30Days,
    });

    console.log('[Seed] Organizations created: ABC-CORP (Root), ABC-HN (Child), ABC-HCM (Child)');

    // 4. Create Org Admin and Staff users
    const orgAdmin = await User.create({
      fullName: 'Nguyễn Văn Quản Trị',
      email: 'orgadmin@abc.com',
      passwordHash: '123456',
      organizationId: rootOrg._id,
      role: 'ORGANIZATION_ADMIN',
      status: 'ACTIVE',
    });

    const staffHn = await User.create({
      fullName: 'Trần Thị Nhân Viên HN',
      email: 'staff@abc-hn.com',
      passwordHash: '123456',
      organizationId: hnOrg._id,
      role: 'STAFF',
      status: 'ACTIVE',
    });

    console.log('[Seed] Users created: orgadmin@abc.com / 123456, staff@abc-hn.com / 123456');

    // 5. Create Master Data in Root Org
    await MasterData.create({
      organizationId: rootOrg._id,
      type: 'EMPLOYEE',
      code: 'NV-001',
      data: {
        fullName: 'Nguyễn Văn A',
        dob: '1992-05-15',
        position: 'Kỹ sư Phần mềm Senior',
        department: 'Phòng Kỹ thuật',
        idNumber: '001092001234',
        idIssueDate: '2021-08-20',
        idIssuePlace: 'Cục QLHC về TTXH',
        phone: '0988776655',
        email: 'nguyenvana@abc.com',
        address: 'Số 15 Phố Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội',
      }
    });

    await MasterData.create({
      organizationId: rootOrg._id,
      type: 'EMPLOYEE',
      code: 'NV-002',
      data: {
        fullName: 'Trần Thị Thu Hà',
        dob: '1995-11-20',
        position: 'Chuyên viên Tuyên dụng & HR',
        department: 'Phòng Nhân sự',
        idNumber: '001195009876',
        idIssueDate: '2022-03-10',
        idIssuePlace: 'Cục QLHC về TTXH',
        phone: '0912345678',
        email: 'tranthithuha@abc.com',
        address: 'Số 88 Đường Xuân Thủy, Q. Cầu Giấy, Hà Nội',
      }
    });

    await MasterData.create({
      organizationId: rootOrg._id,
      type: 'EMPLOYEE',
      code: 'NV-003',
      data: {
        fullName: 'Phạm Minh Đức',
        dob: '1990-03-12',
        position: 'Trưởng Phòng Kinh Doanh',
        department: 'Phòng Kinh doanh',
        idNumber: '001090005544',
        idIssueDate: '2020-01-15',
        idIssuePlace: 'Cục QLHC về TTXH',
        phone: '0977889900',
        email: 'phamminhduc@abc.com',
        address: 'Tòa nhà Landmark 72, Nam Từ Liêm, Hà Nội',
      }
    });

    await MasterData.create({
      organizationId: rootOrg._id,
      type: 'CUSTOMER',
      code: 'KH-001',
      data: {
        companyName: 'Công Ty TNHH Giải Pháp Công Nghệ X',
        taxCode: '0101234567',
        representative: 'Lê Văn B',
        repPosition: 'Giám Đốc Điều Hành',
        phone: '02439998888',
        email: 'contact@techx.vn',
        address: 'Tầng 5, Tòa nhà Innovation, Cầu Giấy, Hà Nội',
      }
    });

    console.log('[Seed] MasterData created.');

    // 6. Create Template with Dynamic Fields
    const templateFields = [
      {
        id: 'f1',
        key: 'employee.fullName',
        label: 'Họ và tên Người lao động',
        type: 'TEXT',
        required: true,
        masterDataBinding: { type: 'EMPLOYEE', sourceField: 'fullName' }
      },
      {
        id: 'f2',
        key: 'employee.position',
        label: 'Chức danh vị trí công việc',
        type: 'TEXT',
        required: true,
        masterDataBinding: { type: 'EMPLOYEE', sourceField: 'position' }
      },
      {
        id: 'f3',
        key: 'employee.dob',
        label: 'Ngày sinh',
        type: 'DATE',
        required: true,
        defaultValue: '28/05/2004'
      },
      {
        id: 'f4',
        key: 'employee.idNumber',
        label: 'Số CMND/CCCD',
        type: 'TEXT',
        required: true,
        defaultValue: '001237137612361'
      },
      {
        id: 'f5',
        key: 'employee.idDate',
        label: 'Ngày cấp CMND/CCCD',
        type: 'DATE',
        required: true,
        defaultValue: '02/04/2022'
      }
    ];

    const templateHtml = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; color: #000000; padding: 10px; background: #ffffff;">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="width: 40%; text-align: center; vertical-align: top; padding: 6px; border: 1px dashed #cbd5e1;">
        <p style="font-weight: bold; margin: 0; font-size: 13pt; text-indent: 0;">CTY TNHH SX&TM MAY VINA</p>
        <p style="font-style: italic; margin: 4px 0 0 0; font-size: 12pt; text-indent: 0;">Số: 0112/2025/HĐLĐ-MVN</p>
      </td>
      <td style="width: 60%; text-align: center; vertical-align: top; padding: 6px; border: 1px dashed #cbd5e1;">
        <p style="font-weight: bold; margin: 0; font-size: 13pt; text-indent: 0; white-space: nowrap;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="font-weight: bold; margin: 4px 0 0 0; font-size: 13pt; text-indent: 0; white-space: nowrap;">Độc lập – Tự do – Hạnh phúc</p>
      </td>
    </tr>
  </table>
  
  <p style="text-align: center; font-size: 18pt; font-weight: bold; margin-top: 24px; margin-bottom: 16px; text-indent: 0;">HỢP ĐỒNG LAO ĐỘNG</p>
  
  <p style="text-align: center; font-style: italic; margin: 4px 0; text-indent: 0;">Căn cứ vào Bộ luật Dân sự 2015;</p>
  <p style="text-align: center; font-style: italic; margin: 4px 0; text-indent: 0;">Căn cứ vào Luật Lao động 2019;</p>
  <p style="text-align: center; font-style: italic; margin: 4px 0 16px 0; text-indent: 0;">Căn cứ nhu cầu thực tế của các bên.</p>
  
  <p style="text-align: justify; text-indent: 1cm; margin-bottom: 14px; line-height: 1.5;">Hôm nay, ngày 01 tháng 12 năm 2025 tại Công Ty Trách Nhiệm Hữu Hạn Sản Xuất Và Thương Mại May Vina Chúng tôi gồm:</p>
  
  <p style="font-weight: bold; margin-top: 14px; margin-bottom: 6px;">BÊN NGƯỜI SỬ DỤNG LAO ĐỘNG (BÊN A):</p>
  <p style="margin: 4px 0;">Tên tổ chức: Công Ty Trách Nhiệm Hữu Hạn Sản Xuất Và Thương Mại May Vina.</p>
  <p style="margin: 4px 0;">Địa chỉ trụ sở: Số 55, ngõ 68, đường Phú Diễn, tổ 2, phường Phú Diễn, Hà Nội.</p>
  <p style="margin: 4px 0;">Mã số doanh nghiệp: 0110031226 do phòng đăng ký kinh doanh Sở kế hoạch và đầu tư thành phố Hà Nội cấp lần đầu ngày 15/06/2022.</p>
  <p style="margin: 4px 0 14px 0;">Người đại diện theo pháp luật là: Ông <strong>Trần Trọng Quý</strong>. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: <strong>Giám đốc</strong>.</p>
  
  <p style="font-weight: bold; margin-top: 14px; margin-bottom: 6px;">BÊN NGƯỜI LAO ĐỘNG (BÊN B):</p>
  <p style="margin: 4px 0;">Ông/Bà: <strong>{{employee.fullName}}</strong></p>
  <p style="margin: 4px 0;">Ngày sinh: {{employee.dob}}</p>
  <p style="margin: 4px 0;">Số CMND/CCCD: {{employee.idNumber}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Ngày cấp: {{employee.idDate}}</p>
  <p style="margin: 4px 0;">Nơi cấp: Cục CS QLHC về TTXH</p>
  <p style="margin: 4px 0;">Hộ khẩu thường trú: Skjdjfkjhfjkljashgfsagffsasgsg</p>
  <p style="margin: 4px 0 10px 0;">Nơi ở hiện tại: Rsefswafojkhafolisahgf</p>
  
  <p style="text-align: justify; margin-top: 10px; margin-bottom: 14px;">Hai bên thỏa thuận ký kết hợp đồng lao động và cam kết làm đúng những điều khoản sau đây:</p>

  <p style="font-weight: bold; margin-top: 14px; margin-bottom: 6px;">Điều 1: Thời hạn và công việc hợp đồng</p>
  <p style="margin: 4px 0 4px 16px;">- Loại hợp đồng lao động: Không kỳ hạn.</p>
  <p style="margin: 4px 0 4px 16px;">- Địa điểm làm việc: 18BT7, Foresa 6A, KĐT Foresa Xuân Phương, phường Xuân Phương Hà Nội.</p>
  <p style="margin: 4px 0 4px 16px;">- Chức danh chuyên môn: <strong>{{employee.position}}</strong></p>
  <p style="margin: 4px 0 4px 16px;">- Công việc phải làm: Tư vấn, giới thiệu và bán sản phẩm quần áo trẻ em; tìm kiếm khách hàng, chăm sóc khách hàng...</p>
  <p style="margin: 4px 0 4px 16px;">- Nhiệm vụ công việc khác:</p>
  <p style="margin: 4px 0 4px 32px;">+ Thực hiện các công việc chuyên môn theo đúng chức danh dưới sự quản lý, điều hành của Công ty hoặc cá nhân được giao.</p>
  <p style="margin: 4px 0 4px 32px;">+ Tư vấn sản phẩm, giải đáp thắc mắc, hỗ trợ khách hàng trong quá trình mua hàng và sau bán hàng.</p>
  <p style="margin: 4px 0 4px 32px;">+ Phối hợp với các bộ phận liên quan để xử lý đơn hàng, theo dõi tiến độ giao hàng và chăm sóc khách hàng.</p>
  <p style="margin: 4px 0 4px 32px;">+ Thực hiện báo cáo công việc, doanh số và tình hình khách hàng theo yêu cầu của Công ty.</p>
  <p style="margin: 4px 0 4px 32px;">+ Nghiên cứu thị trường, cập nhật xu hướng tiêu dùng và đề xuất các giải pháp nhằm nâng cao hiệu quả kinh doanh.</p>
  <p style="margin: 4px 0 4px 32px;">+ Thực hiện các công việc khác có liên quan theo yêu cầu của Công ty hoặc cá nhân được bổ nhiệm, ủy quyền phụ trách.</p>

  <p style="font-weight: bold; margin-top: 14px; margin-bottom: 6px;">Điều 2: Chế độ làm việc</p>
  <p style="margin: 4px 0 4px 16px;">- Thời giờ làm việc: 8 giờ/ngày.</p>
  <p style="margin: 4px 0 4px 16px;">- Từ ngày Thứ 2 đến ngày Thứ 7 hàng tuần.</p>
  <p style="margin: 4px 0 4px 32px;">+ Buổi sáng: 8h00 - 12h00;</p>
  <p style="margin: 4px 0 4px 32px;">+ Buổi chiều: 13h30 - 17h30.</p>
  
  <table style="width: 100%; margin-top: 36px; border-collapse: collapse; table-layout: fixed;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 4px;">ĐẠI DIỆN BÊN A</p>
        <p style="font-style: italic; font-size: 11pt; color: #555;">(Ký, đóng dấu và ghi rõ họ tên)</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 4px;">ĐẠI DIỆN BÊN B</p>
        <p style="font-style: italic; font-size: 11pt; color: #555;">(Ký và ghi rõ họ tên)</p>
      </td>
    </tr>
  </table>
</div>
    `.trim();

    const template = await Template.create({
      organizationId: rootOrg._id,
      name: 'Hợp Đồng Lao Động CTY MAY VINA (Chuẩn Word)',
      category: 'Lao động',
      description: 'Mẫu hợp đồng lao động chuẩn ban hành theo file Word của công ty',
      status: 'ACTIVE',
      currentVersion: 1,
      createdBy: orgAdmin._id,
    });

    await TemplateVersion.create({
      templateId: template._id,
      organizationId: rootOrg._id,
      version: 1,
      fields: templateFields,
      templateContentHtml: templateHtml,
      createdBy: orgAdmin._id,
    });

    console.log('[Seed] Template & TemplateVersion created.');

    // 7. Create a Sample Contract generated from template
    const sampleInput = {
      'employee.fullName': 'PHÙNG VĂN DŨNG',
      'employee.position': 'Nhân viên Media',
      'employee.dob': '28/05/2004',
      'employee.idNumber': '001237137612361',
      'employee.idDate': '02/04/2022'
    };

    const contract = await Contract.create({
      organizationId: rootOrg._id,
      code: 'HD_HD-122379',
      title: 'Hợp đồng lao động - Phùng Văn Dũng',
      templateId: template._id,
      templateVersion: 1,
      status: 'GENERATED',
      currentVersion: 1,
      createdBy: orgAdmin._id,
    });

    const renderedSampleContent = templateHtml
      .replace('{{employee.fullName}}', 'PHÙNG VĂN DŨNG')
      .replace('{{employee.position}}', 'Nhân viên Media')
      .replace('{{employee.dob}}', '28/05/2004')
      .replace('{{employee.idNumber}}', '001237137612361')
      .replace('{{employee.idDate}}', '02/04/2022');

    await ContractVersion.create({
      contractId: contract._id,
      organizationId: rootOrg._id,
      version: 1,
      inputData: sampleInput,
      fieldsSnapshot: templateFields,
      renderedContent: renderedSampleContent,
      editedBy: orgAdmin._id,
    });

    console.log('[Seed] Contract & ContractVersion Snapshot created.');
    console.log('[Seed] Seed script finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedData();
