import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Checkbox, message, Table, Modal } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import Axios from '../../Axios'; 
import './UserInfo.css'; 
import { useSubscription } from '../../Context/SubscriptionContext';

const { Option } = Select;

const spare_name = process.env.REACT_APP_SPARE_NAME;
const name_label = process.env.REACT_APP_NAME_LABEL;
const internal_number_label = process.env.REACT_APP_INTERNAL_NUMBER_LABEL;
const ip_number_label = process.env.REACT_APP_IP_NUMBER_LABEL;
const mailbox_label = process.env.REACT_APP_MAILBOX_LABEL;

const UserInfo = ({ user, onSaveSuccess, tabValue }) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { subscriptions } = useSubscription();
  const userRole = JSON.parse(localStorage.getItem("user"))?.role;
  const isRoleAdmin = userRole === 1;

  const transformedData = user ? [user] : [];

  useEffect(() => {
    if (selectedUser) {
      form.setFieldsValue({
        id: selectedUser.id,
        adi: selectedUser.adi,
        internal_number_area_code: selectedUser.internal_number_area_code,
        internal_number: selectedUser.internal_number,
        ip_number_area_code: selectedUser.ip_number_area_code,
        ip_number: selectedUser.ip_number,
        mailbox: selectedUser.mailbox,
        visibility: selectedUser.visibility === 1,
        spare_number: selectedUser.spare_number,
        subscription_id: selectedUser.subscription_id,
      });
    }
  }, [selectedUser, form]);

  const handleSave = async (values) => {
    setIsLoading(true);

    const userToUpdate = {
      id: String(values.id),
      adi: values.adi,
      internal_number_area_code: values.internal_number_area_code,
      internal_number: values.internal_number,
      ip_number_area_code: values.ip_number_area_code,
      ip_number: values.ip_number,
      mailbox: values.mailbox,
      visibility: values.visibility ? 1 : 0,
      spare_number: values.spare_number,
      subscription_id: values.subscription_id || null,
    };

    try {
      await Axios.post('/api/directory/editNode', userToUpdate, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      message.success('Kullanıcı başarıyla güncellendi');
      form.resetFields();
      setIsEditing(false);
      if (onSaveSuccess) {
        onSaveSuccess(); 
        setIsModalVisible(false); 
      }
    } catch (error) {
      message.error('Kullanıcı güncellenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsEditing(false);
    setIsModalVisible(false); 
  };

  if (!user || user.length === 0) {
    return <div className="user-info">Kullanıcı verisi bulunamadı.</div>;
  }

  // Dinamik kolonlar için fonksiyon
  const getColumns = () => {
    if (!isRoleAdmin) {
      // Admin değilse, sadece adi ve ilgili kolonları göster
      if (tabValue === 0) { // Sabit Numara
        return [
          { title: name_label, dataIndex: 'adi', key: 'adi', align: 'center' },
          { title: 'Santral Hattı' + " Alan Kodu", dataIndex: 'internal_number_area_code', key: 'internal_number_area_code', align: 'center' },
          { title: 'Santral Hattı', dataIndex: 'internal_number', key: 'internal_number', align: 'center' },
        ];
      } else if (tabValue === 1) { // IP Numara
        return [
          { title: name_label, dataIndex: 'adi', key: 'adi', align: 'center' },
          { title: ip_number_label, dataIndex: 'ip_number', key: 'ip_number', align: 'center' },
          { title: ip_number_label, dataIndex: 'ip_number', key: 'ip_number', align: 'center' },
        ];
      } else if (tabValue === 2) { // Posta Kutusu
        return [
          { title: name_label, dataIndex: 'adi', key: 'adi', align: 'center' },
          { title: mailbox_label, dataIndex: 'mailbox', key: 'mailbox', align: 'center' },
        ];
      }
    } else {
      // Eğer admin ise tüm kolonlar gösterilecek
      return [
        { title: 'Hiyerarşi', dataIndex: 'hiyerad', key: 'hiyerad', align: 'center' },
        { title: name_label, dataIndex: 'adi', key: 'adi', align: 'center' },
        { title: internal_number_label + " Alan Kodu", dataIndex: 'internal_number_area_code', key: 'internal_number_area_code', align: 'center' },
        { title: internal_number_label, dataIndex: 'internal_number', key: 'internal_number', align: 'center' },
        { title: ip_number_label + " Alan Kodu", dataIndex: 'ip_number_area_code', key: 'ip_number_area_code', align: 'center' },
        { title: ip_number_label, dataIndex: 'ip_number', key: 'ip_number', align: 'center' },
        { title: mailbox_label, dataIndex: 'mailbox', key: 'mailbox', align: 'center' },
        { title: spare_name, dataIndex: 'spare_number', key: 'spare_number', align: 'center' },
        {
          title: 'Abonelik Türü',
          dataIndex: 'subscription_id',
          key: 'subscription_id',
          align: 'center',
          render: id => {
            const selectedSubscription = subscriptions.find(opt => opt.value === id);
            return selectedSubscription ? selectedSubscription.label : ' ';
          }
        },
        {
          title: 'İşlemler',
          key: 'actions',
          align: 'center',
          render: (text, record) => (
            <Button icon={<EditOutlined />} onClick={() => showUpdateModal(record)} type="primary">
              Güncelle
            </Button>
          ),
        }
      ];
    }
  };

  const showUpdateModal = (record) => {
    setSelectedUser(record);
    form.setFieldsValue(record);
    setIsModalVisible(true); 
  };

  return (
    <div className="user-info">
      <Table
        dataSource={transformedData}
        columns={getColumns()} // Dinamik kolonlar burada belirleniyor
        rowKey="id"
        pagination={false}
        bordered
        className="my-custom-table"
      />
      <Modal
        title="Kullanıcı Güncelle"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        className="dark-modal" 
      >
        <Form
          form={form}
          onFinish={handleSave}
          layout="vertical"
        >
          <Form.Item name="id" noStyle>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="adi" label={name_label}>
            <Input />
          </Form.Item>
          <Form.Item name="internal_number_area_code" label={internal_number_label + " Alan Kodu"}>
            <Input />
          </Form.Item>
          <Form.Item name="internal_number" label={internal_number_label}>
            <Input />
          </Form.Item>
          <Form.Item name="ip_number_area_code" label={ip_number_label + " Alan Kodu"}>
            <Input />
          </Form.Item>
          <Form.Item name="ip_number" label={ip_number_label}>
            <Input />
          </Form.Item>
          <Form.Item name="mailbox" label={mailbox_label} rules={[
            { type: 'email', message: 'Geçersiz Email!' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} className="submit-button">
              Kaydet
            </Button>
            <Button className="cancel-button" style={{ marginLeft: '10px' }} onClick={handleCancel}>
              İptal
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserInfo;
