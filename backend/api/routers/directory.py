from sqlalchemy import Column, null, or_, and_
from fastapi import FastAPI, status, HTTPException, Depends, APIRouter, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from api.deps import get_db, get_current_user
from api.db.models import Directory,Hierarchy, SubscriptionTypes, User
from api.schemas import DirectoryEditV, SubscriptionEditV, SubscriptionCreateV
from typing import List, Dict, Any
import os
import shutil
from fastapi.responses import FileResponse
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.getenv('DATABASE_PATH')
BACKUP_PATH = os.getenv('BACKUP_PATH')

router = APIRouter()

def build_tree(
        directories: List[Directory],
        hiyerarcy_dict: dict[int, Hierarchy]
):
    root_nodes = [directory for directory in directories if directory.ataid is None]
    tree = build_subtree(root_nodes, directories, hiyerarcy_dict)
    return tree

def build_subtree(
        parent_nodes: List[Directory],
        all_nodes: List[Directory],
        hiyerarcy_dict: dict[int, Hierarchy]
):
    subtree = []

    for parent in parent_nodes:
        child_nodes = [node for node in all_nodes if node.ataid == parent.id]
        hierarcy = hiyerarcy_dict.get(parent.hiyerid, None)

        node = {
            'id': parent.id,
            'title': hierarcy.adi if hierarcy else '',
            'children': build_subtree(child_nodes, all_nodes, hiyerarcy_dict)
        }
        subtree.append(node)

    return subtree

@router.get("/getTree", summary="List all")
async def get_tree(
    db: Session = Depends(get_db)
):
    directories = db.query(Directory).all()
    hierarcies = db.query(Hierarchy).all()
    hiyerarcy_dict = {hiyerarcy.id: hiyerarcy for hiyerarcy in hierarcies}

    result = build_tree(directories, hiyerarcy_dict)
    return result

@router.get("/getTreeForUser", summary="List all")
async def get_tree_for_user(
    db: Session = Depends(get_db)
):
    hierarcies = db.query(Hierarchy).filter(Hierarchy.visibility == 1).all()
    visible_hiyer_ids = {hiyerarcy.id for hiyerarcy in hierarcies}

    directories = db.query(Directory).filter(Directory.hiyerid.in_(visible_hiyer_ids)).all()
    hiyerarcy_dict = {hiyerarcy.id: hiyerarcy for hiyerarcy in hierarcies}

    result = build_tree(directories, hiyerarcy_dict)
    return result

@router.post("/editNode", summary="Edit Node")
async def edit_node(
    node_data: DirectoryEditV, 
    db: Session = Depends(get_db)
):

    directory = db.query(Directory).filter(Directory.id == node_data.id).first()

    db_node = db.query(Hierarchy).filter(Hierarchy.id == directory.hiyerid).first()
    if not db_node:
        raise HTTPException(status_code=400, detail="Node not found")

    # Update fields only if provided
    if node_data.adi is not None and db_node.adi != node_data.adi:
        db_node.adi = node_data.adi
    if node_data.internal_number_area_code is not None and db_node.internal_number_area_code != node_data.internal_number_area_code:
        db_node.internal_number_area_code = node_data.internal_number_area_code
    if node_data.internal_number is not None and db_node.internal_number != node_data.internal_number:
        db_node.internal_number = node_data.internal_number
    if node_data.ip_number_area_code is not None and db_node.ip_number_area_code != node_data.ip_number_area_code:
        db_node.ip_number_area_code = node_data.ip_number_area_code
    if node_data.ip_number is not None and db_node.ip_number != node_data.ip_number:
        db_node.ip_number = node_data.ip_number
    if node_data.mailbox is not None and db_node.mailbox != node_data.mailbox:
        db_node.mailbox = node_data.mailbox
    if node_data.visibility is not None and db_node.visibility != node_data.visibility:
        db_node.visibility = node_data.visibility
    if node_data.spare_number is not None and db_node.spare_number != node_data.spare_number:
        db_node.spare_number = node_data.spare_number
    if node_data.subscription_id is not None and db_node.subscription_id != node_data.subscription_id:
        db_node.subscription_id = node_data.subscription_id

    db.commit()
    
    return {
        "adi": db_node.adi,
        "internal_number_area_code": db_node.internal_number_area_code,
        "internal_number": db_node.internal_number,
        "ip_number_area_code": db_node.ip_number_area_code,
        "ip_number": db_node.ip_number,
        "mailbox": db_node.mailbox,
        "visibility": db_node.visibility,
        "spare_number": db_node.spare_number,
        "subscription_id": db_node.subscription_id
    }

@router.get("/getNode/{id}", summary="Get Node and its Sub-nodes")
async def get_node(
    id: int, 
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    def get_node_and_subnodes(node_id: int) -> Dict:
        # Fetch the node
        directory = db.query(Directory).filter(Directory.id == node_id).first()
        if not directory:
            return {"id": node_id, "children": []}

        # Fetch the hierarchy and subscription details
        hierarchy = db.query(Hierarchy).filter(Hierarchy.id == directory.hiyerid).first()
        subscription = db.query(SubscriptionTypes).filter(SubscriptionTypes.id == hierarchy.subscription_id).first()
        
        # Prepare the node data
        node_data = {
            "id": directory.id,
            "adi": hierarchy.adi,
            "internal_number_area_code": hierarchy.internal_number_area_code,
            "internal_number": hierarchy.internal_number,
            "ip_number_area_code": hierarchy.ip_number_area_code,
            "ip_number": hierarchy.ip_number,
            "mailbox": hierarchy.mailbox,
            "visibility": hierarchy.visibility,
            "spare_number": hierarchy.spare_number,
            "subscription_id": hierarchy.subscription_id,
            "subscription": subscription.subscription_types,
            "children": []  # Initialize the children
        }

        # Fetch and add child nodes
        sub_directories = db.query(Directory).filter(Directory.ataid == directory.id).all()
        for sub_directory in sub_directories:
            sub_node_data = get_node_and_subnodes(sub_directory.id)
            node_data["children"].append(sub_node_data)

        return node_data

    # Fetch the main node and its sub-nodes
    result = get_node_and_subnodes(id)
    return result


@router.get("/getSubscription", summary="Get Subcsription Types")
async def get_subscription(
    db: Session = Depends(get_db)
):
    result = []

    subscription = db.query(SubscriptionTypes).all()

    for subs in subscription:
        result.append({
            "value": subs.id,
            "label": subs.subscription_types
        })

    return result

@router.put("/editSubscription", summary="Edit Subscription")
async def edit_subscription(
    subs: SubscriptionEditV,  # FastAPI will automatically parse this from the request body
    db: Session = Depends(get_db)
):
    # Query the database for the subscription type by ID
    db_subs = db.query(SubscriptionTypes).filter(SubscriptionTypes.id == subs.id).first()

    if not db_subs:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Update the subscription type if different
    if db_subs.subscription_types != subs.subscription_types:
        db_subs.subscription_types = subs.subscription_types

    # Commit the changes to the database
    db.commit()

    return {
        "id": db_subs.id,
        "subscription_types": db_subs.subscription_types
    }

@router.post("/addSubscription", summary="Add Subscription")
async def add_subscription(
    subscription: SubscriptionCreateV,
    db: Session = Depends(get_db)
):
    new_sub = SubscriptionTypes(subscription_types=subscription.subscription_types)
    db.add(new_sub)
    try:
        db.commit()
        return {"status": "success", "message": "Subscription added successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@router.delete("/deleteSubscription/{id}", summary="Delete Subscription")
async def delete_subscription(
    id: int, 
    db: Session = Depends(get_db)
):
    # Fetch the subscription to delete
    subscription = db.query(SubscriptionTypes).filter(SubscriptionTypes.id == id).first()

    # If subscription is not found, raise a 404 error
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )

    # Delete the subscription
    db.delete(subscription)

    # Commit the transaction
    db.commit()

    return {"detail": "Subscription deleted successfully"}

@router.post("/backupDatabase", summary="Backup Database and Download")
async def backup_database_and_download(
    db: Session = Depends(get_db)
):
    try:
        # Yedekleme dizinini oluştur
        os.makedirs(BACKUP_PATH, exist_ok=True)
        
        # Yedekleme dosyasının adını oluştur
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f'database_backup_{timestamp}.db'
        backup_path = os.path.join(BACKUP_PATH, backup_filename)

        # Veritabanını yedekle
        shutil.copy2(DATABASE_PATH, backup_path)

        # Yedekleme dosyasını döndür
        return FileResponse(backup_path, filename=backup_filename, headers={"Content-Disposition": f"attachment; filename={backup_filename}"})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")
    
@router.post("/restoreDatabase", summary="Restore Database from Backup")
async def restore_database(file: UploadFile = File(...)):
    try:
        # Geçici dosya yolu oluştur
        temp_file_path = os.path.join(BACKUP_PATH, file.filename)

        # Yüklenen dosyayı geçici dosya olarak kaydet
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Veritabanını geri yükle
        shutil.copy2(temp_file_path, DATABASE_PATH)

        # Geçici dosyayı sil
        os.remove(temp_file_path)

        return {"status": "success", "message": "Database restored successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
