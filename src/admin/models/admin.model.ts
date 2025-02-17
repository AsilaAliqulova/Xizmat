import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IAdminCReationAttr {
  userId: number | undefined;
  username: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  lang: string | undefined;
}
@Table({ tableName: "admin" })
export class Admin extends Model<Admin, IAdminCReationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  userId: number;
  @Column({
    type: DataType.STRING,
  })
  username: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  first_name: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  last_name: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  phone_number: string;
  @Column({
    type: DataType.STRING,
  })
  lang: string | undefined;

 
}
